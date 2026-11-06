import crypto from "crypto"
import NodeCache from "node-cache"
import { Op } from "sequelize"
import dayjs from "dayjs"
import db from "../repository/hotels.repository.js"
import logger from "../../../middleware/logger.js"
import ratehawkConfig, { RT_TIMEOUTS, RatehawkError } from "./ratwhawk.config.js"
import { HotelContentStatus } from "../../../database/models/hotelModel.js"
import { HotelStaticDataKeys } from "../../../database/models/hotelStaticDataModel.js"
import { queueHotelsForContent } from "./content-sync.service.js"
import { hasFreeCancellation, normalizeRate } from "./rate-normalizer.js"
import { getHotelPricing, priceRate, priceSerpHotel, sellingAmount, SUPPLIER_CURRENCY } from "./hotel-pricing.service.js"

/**
 * Steps 2 (search + hotelpage) and 3 (prebook) of the ETG integration flow.
 * Rates come live from ETG; all property content is read from our database.
 */

export const SEARCH_LANGUAGE = "en"
// SERP results back pagination/filtering only; search_hash itself lives 38 minutes
const SERP_CACHE_TTL = 10 * 60
// ETG recommended rate lifetime; the guide allows keeping hotelpage rates up to 1 hour
const HOTELPAGE_CACHE_TTL = 30 * 60
const REFERENCE_CACHE_TTL = 60 * 60
// Upper bound the ETG search may spend server-side (max 100s), below our HTTP timeout
const ETG_SEARCH_TIMEOUT_SECONDS = 40
const PREBOOK_PRICE_INCREASE_PERCENT = Math.min(100, Math.max(0, Number(process.env.RATEHAWK_PREBOOK_PRICE_INCREASE_PERCENT ?? 10)))
const PREBOOK_VALIDITY_MINUTES = 60
const SERP_RATES_PER_HOTEL = 2 // guide: show one or two lowest rates per hotel
const MAX_HOTEL_IMAGES_IN_SERP = 8
const DB_IN_CHUNK = 1000

// In-process cache: one entry per search / hotelpage. Move to a shared store (e.g. Redis) before running multiple instances.
const cache = new NodeCache({ useClones: false, checkperiod: 120, maxKeys: 5000 })

export class HotelServiceError extends Error {
    constructor(status, message, code = null) {
        super(message)
        this.name = "HotelServiceError"
        this.status = status
        this.code = code
    }
}

function cacheSet(key, value, ttl) {
    try {
        cache.set(key, value, ttl)
    } catch (error) {
        // maxKeys reached: serve the response uncached rather than failing the request
        logger.warn(`[hotels] cache set skipped for ${key}: ${error.message}`)
    }
}

const hashKey = (prefix, payload) => `${prefix}:${crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex")}`

/** Normalised stay parameters shared by search, hotelpage and prebook. */
export function toStayParams(body) {
    return {
        checkin: body.checkin,
        checkout: body.checkout,
        residency: String(body.residency).toLowerCase(),
        // Always search in the supplier currency; conversion for the viewer happens in hotel-pricing.service.js
        currency: SUPPLIER_CURRENCY,
        guests: body.guests.map((room) => ({
            adults: Number(room.adults),
            children: (room.children ?? []).map(Number),
        })),
    }
}

function staySummary(params) {
    const nights = dayjs(params.checkout).diff(dayjs(params.checkin), "day")
    return {
        ...params,
        nights,
        rooms: params.guests.length,
        total_guests: params.guests.reduce((sum, room) => sum + room.adults + room.children.length, 0),
    }
}

export const etgStayPayload = (params) => ({
    checkin: params.checkin,
    checkout: params.checkout,
    residency: params.residency,
    language: SEARCH_LANGUAGE,
    guests: params.guests,
    currency: params.currency,
    timeout: ETG_SEARCH_TIMEOUT_SECONDS,
})

async function findSyncedHotels(hids, attributes) {
    const rows = []
    for (let i = 0; i < hids.length; i += DB_IN_CHUNK) {
        const part = await db.Hotels.findAll({
            where: { hid: hids.slice(i, i + DB_IN_CHUNK), contentStatus: HotelContentStatus.synced, deleted: false },
            attributes,
        })
        rows.push(...part)
    }
    return rows
}

// ------------------------------------------------------------------ reference data (local only)

export async function getRegion(regionId) {
    const region = await db.HotelRegions.findByPk(regionId)
    if (!region) throw new HotelServiceError(404, "Destination not found", "region_not_found")
    return region
}

export async function searchDestinations(query) {
    const term = query.trim()
    const key = `destinations:${term.toLowerCase()}`
    const cached = cache.get(key)
    if (cached) return cached

    const escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`)
    const [regions, hotels] = await Promise.all([
        db.HotelRegions.findAll({
            where: { name: { [Op.like]: `%${escaped}%` }, hotelsCount: { [Op.gt]: 0 } },
            order: [["hotelsCount", "DESC"]],
            limit: 8,
        }),
        db.Hotels.findAll({
            where: { name: { [Op.like]: `%${escaped}%` }, contentStatus: HotelContentStatus.synced, deleted: false },
            attributes: ["hid", "name", "address", "starRating", "regionId"],
            include: [{ model: db.HotelRegions, attributes: ["name", "countryCode"] }],
            limit: 6,
        }),
    ])

    const result = {
        regions: regions.map(serializeDestinationRegion),
        hotels: hotels.map(serializeDestinationHotel),
    }
    cacheSet(key, result, 5 * 60)
    return result
}

const serializeDestinationRegion = (region) => ({
    id: Number(region.id),
    name: region.name,
    type: region.type,
    country_code: region.countryCode,
    hotels_count: region.hotelsCount,
})

const serializeDestinationHotel = (hotel) => ({
    hid: Number(hotel.hid),
    name: hotel.name,
    address: hotel.address,
    star_rating: hotel.starRating,
    region_id: hotel.regionId ? Number(hotel.regionId) : null,
    region_name: hotel.HotelRegion?.name ?? null,
    country_code: hotel.HotelRegion?.countryCode ?? null,
})

/**
 * Suggestions shown before the visitor types: regions and top-rated hotels in their
 * country, or the most stocked destinations overall when we hold nothing there.
 */
export async function popularDestinations(countryCode) {
    const country = countryCode ? String(countryCode).toUpperCase() : null
    const key = `popular-destinations:${country ?? "all"}`
    const cached = cache.get(key)
    if (cached) return cached

    const load = (byCountry) => Promise.all([
        db.HotelRegions.findAll({
            where: { hotelsCount: { [Op.gt]: 0 }, ...(byCountry ? { countryCode: country } : {}) },
            order: [["hotelsCount", "DESC"]],
            limit: 6,
        }),
        db.Hotels.findAll({
            where: {
                contentStatus: HotelContentStatus.synced, deleted: false, isClosed: false,
                ...(byCountry ? { countryCode: country } : {}),
            },
            attributes: ["hid", "name", "address", "starRating", "regionId"],
            include: [{ model: db.HotelRegions, attributes: ["name", "countryCode"] }],
            order: [["starRating", "DESC"], ["name", "ASC"]],
            limit: 6,
        }),
    ])

    let scope = "country"
    let [regions, hotels] = country ? await load(true) : [[], []]
    if (regions.length === 0 && hotels.length === 0) {
        scope = "global";
        [regions, hotels] = await load(false)
    }

    const result = {
        scope,
        country_code: scope === "country" ? country : null,
        regions: regions.map(serializeDestinationRegion),
        hotels: hotels.map(serializeDestinationHotel),
    }
    cacheSet(key, result, REFERENCE_CACHE_TTL)
    return result
}

export async function getFilterReference() {
    const key = "filter-reference"
    const cached = cache.get(key)
    if (cached) return cached

    const rows = await db.HotelStaticData.findAll({
        where: { key: [HotelStaticDataKeys.filter_values, HotelStaticDataKeys.hotel_static] },
    })
    const filters = rows.find((row) => row.key === HotelStaticDataKeys.filter_values)?.data ?? {}
    const hotelStatic = rows.find((row) => row.key === HotelStaticDataKeys.hotel_static)?.data ?? {}
    const translate = (items = []) => items
        .filter((item) => item?.name)
        .map((item) => ({ value: item.name, desc: item.locale?.[SEARCH_LANGUAGE] ?? item.name }))

    const result = {
        serp_filters: filters.serp_filter ?? [],
        kinds: filters.kind ?? [],
        star_ratings: filters.star_rating ?? [],
        meals: translate(hotelStatic.meals),
        room_amenities: translate(hotelStatic.room_amenities),
        taxes: translate(hotelStatic.taxes),
    }
    cacheSet(key, result, REFERENCE_CACHE_TTL)
    return result
}

export async function getHotelContent(hid) {
    const hotel = await db.Hotels.findOne({
        where: { hid, contentStatus: HotelContentStatus.synced, deleted: false },
        include: [{ model: db.HotelRegions }],
    })
    if (!hotel) throw new HotelServiceError(404, "Hotel not found", "hotel_not_found")

    return {
        hid: Number(hotel.hid),
        name: hotel.name,
        kind: hotel.kind,
        star_rating: hotel.starRating,
        hotel_chain: hotel.hotelChain,
        address: hotel.address,
        postal_code: hotel.postalCode,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        region: hotel.HotelRegion
            ? { id: Number(hotel.HotelRegion.id), name: hotel.HotelRegion.name, type: hotel.HotelRegion.type, country_code: hotel.HotelRegion.countryCode }
            : null,
        check_in_time: hotel.checkInTime,
        check_in_time_end: hotel.checkInTimeEnd,
        check_out_time: hotel.checkOutTime,
        front_desk_time_start: hotel.frontDeskTimeStart,
        front_desk_time_end: hotel.frontDeskTimeEnd,
        is_closed: hotel.isClosed,
        is_gender_specification_required: hotel.isGenderSpecificationRequired,
        images: hotel.images,
        amenity_groups: hotel.amenityGroups,
        description_struct: hotel.descriptionStruct,
        metapolicy_struct: hotel.metapolicyStruct,
        metapolicy_extra_info: hotel.metapolicyExtraInfo,
        // Free-text policy sections (e.g. "Know before you go", fees) and accepted payment methods
        policy_struct: hotel.policyStruct ?? [],
        payment_methods: hotel.paymentMethods ?? [],
        room_groups: (hotel.roomGroups ?? []).map((group) => ({
            name: group.name,
            name_struct: group.name_struct,
            room_amenities: group.room_amenities ?? [],
            images: group.images_ext ?? [],
            rg_ext: group.rg_ext ?? null,
        })),
        serp_filters: hotel.serpFilters,
        facts: hotel.facts,
    }
}

// ------------------------------------------------------------------ 2.1 search by region

function summariseSerpHotel(hotel, content, now) {
    const rates = (hotel.rates ?? [])
        .map(normalizeRate)
        // Package rates must not be sold / priced separately
        .filter((rate) => !rate.is_package && rate.payment?.show_amount !== null)
        .sort((a, b) => a.payment.show_amount - b.payment.show_amount)
    if (rates.length === 0) return null

    const cheapest = rates[0]
    return {
        hid: Number(hotel.hid),
        name: content.name,
        kind: content.kind,
        star_rating: content.starRating ?? 0,
        address: content.address,
        latitude: content.latitude,
        longitude: content.longitude,
        images: (content.images ?? []).slice(0, MAX_HOTEL_IMAGES_IN_SERP).map((image) => image.url),
        serp_filters: content.serpFilters ?? [],
        min_price: cheapest.payment.show_amount,
        currency: cheapest.payment.show_currency,
        meals: [...new Set(rates.map((rate) => rate.meal.category))],
        has_free_cancellation: rates.some((rate) => hasFreeCancellation(rate.payment, now)),
        payment_types: [...new Set(rates.flatMap((rate) => rate.payment_types.map((payment) => payment.type)))],
        rates_count: rates.length,
        // Shown for orientation only - the guest selects a rate on the hotel page
        rates: rates.slice(0, SERP_RATES_PER_HOTEL).map((rate) => ({
            room_name: rate.room_name,
            meal: rate.meal,
            payment: { type: rate.payment.type, show_amount: rate.payment.show_amount, show_currency: rate.payment.show_currency, free_cancellation_before: rate.payment.free_cancellation_before },
        })),
    }
}

async function fetchRegionSerp(regionId, params) {
    const key = hashKey("serp", { regionId, ...params })
    const cached = cache.get(key)
    if (cached) return cached

    const response = await ratehawkConfig.post({
        endpoint: ratehawkConfig.apis.b2b_search_serp_region,
        data: { ...etgStayPayload(params), region_id: regionId },
        timeout: RT_TIMEOUTS.search,
    })
    const serpHotels = response.data?.hotels ?? []
    const hids = serpHotels.map((hotel) => Number(hotel.hid)).filter(Boolean)

    const contents = await findSyncedHotels(hids, [
        "hid", "name", "kind", "starRating", "address", "latitude", "longitude", "images", "serpFilters",
    ])
    const contentByHid = new Map(contents.map((row) => [Number(row.hid), row]))

    // Unknown hids are queued for the next content sync - never fetched in this request
    const missing = hids.filter((hid) => !contentByHid.has(hid))
    if (missing.length > 0) {
        queueHotelsForContent(missing).catch((error) => logger.error(`[hotels] queue missing content failed: ${error.message}`))
    }

    const now = Date.now()
    const hotels = serpHotels
        .map((hotel) => {
            const content = contentByHid.get(Number(hotel.hid))
            return content ? summariseSerpHotel(hotel, content, now) : null
        })
        .filter(Boolean)

    const result = {
        total_hotels: response.data?.total_hotels ?? serpHotels.length,
        hotels,
        expires_at: new Date(now + SERP_CACHE_TTL * 1000).toISOString(),
    }
    cacheSet(key, result, SERP_CACHE_TTL)
    return result
}

function countBy(hotels, pick) {
    const counts = {}
    for (const hotel of hotels) {
        for (const value of pick(hotel)) counts[value] = (counts[value] ?? 0) + 1
    }
    return counts
}

const includesAny = (selected, values) => !selected?.length || selected.some((value) => values.includes(value))

/**
 * One test per filter group. Options within a group are OR-ed (any selected star rating),
 * except amenities which are AND-ed (the hotel must offer every selected ETG serp_filter).
 */
const FILTER_TESTS = {
    name: (hotel, filters) => !filters.name?.trim() || hotel.name?.toLowerCase().includes(filters.name.trim().toLowerCase()),
    stars: (hotel, filters) => includesAny(filters.stars, [hotel.star_rating]),
    kinds: (hotel, filters) => includesAny(filters.kinds, [hotel.kind]),
    meals: (hotel, filters) => includesAny(filters.meals, hotel.meals),
    payment_types: (hotel, filters) => includesAny(filters.payment_types, hotel.payment_types),
    serp_filters: (hotel, filters) => !filters.serp_filters?.length || filters.serp_filters.every((value) => hotel.serp_filters.includes(value)),
    free_cancellation: (hotel, filters) => !filters.free_cancellation || hotel.has_free_cancellation,
    price: (hotel, filters) =>
        (filters.price_min === undefined || hotel.min_price >= filters.price_min) &&
        (filters.price_max === undefined || hotel.min_price <= filters.price_max),
}

/** `except` leaves one group out, giving the pool that group's facet counts are taken from */
function applyFilters(hotels, filters = {}, except = null) {
    const tests = Object.entries(FILTER_TESTS).filter(([group]) => group !== except).map(([, test]) => test)
    return hotels.filter((hotel) => tests.every((test) => test(hotel, filters)))
}

/** Keeps selected options listed (with 0) when no hotel matches them any more, so they can be cleared */
function withSelected(counts, selected = []) {
    for (const value of selected) counts[value] ??= 0
    return counts
}

/**
 * Facet counts per group, computed against every *other* active filter: each count is the
 * number of results the visitor gets by ticking that option. The price range spans all
 * available hotels so the slider bounds stay stable while filtering.
 */
function availableFilters(hotels, filters = {}) {
    const pool = (group) => applyFilters(hotels, filters, group)
    const prices = hotels.map((hotel) => hotel.min_price)
    return {
        stars: withSelected(countBy(pool("stars"), (hotel) => [hotel.star_rating]), filters.stars),
        kinds: withSelected(countBy(pool("kinds"), (hotel) => [hotel.kind].filter(Boolean)), filters.kinds),
        meals: withSelected(countBy(pool("meals"), (hotel) => hotel.meals), filters.meals),
        serp_filters: withSelected(countBy(pool("serp_filters"), (hotel) => hotel.serp_filters), filters.serp_filters),
        payment_types: withSelected(countBy(pool("payment_types"), (hotel) => hotel.payment_types), filters.payment_types),
        free_cancellation: pool("free_cancellation").filter((hotel) => hotel.has_free_cancellation).length,
        price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    }
}

const SORTERS = {
    price_asc: (a, b) => a.min_price - b.min_price,
    price_desc: (a, b) => b.min_price - a.min_price,
    stars_desc: (a, b) => b.star_rating - a.star_rating || a.min_price - b.min_price,
}

export async function searchHotelsByRegion({ regionId, params, viewerCountry, filters, sort = "price_asc", page = 1, pageSize = 20 }) {
    const [region, pricing] = await Promise.all([getRegion(regionId), getHotelPricing(viewerCountry)])
    const serp = await fetchRegionSerp(regionId, params)

    // Priced before filtering so price filters and facets are in the viewer's currency
    const hotels = serp.hotels.map((hotel) => priceSerpHotel(hotel, pricing))
    const filtered = applyFilters(hotels, filters).sort(SORTERS[sort] ?? SORTERS.price_asc)
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const currentPage = Math.min(page, totalPages)

    return {
        search: {
            ...staySummary(params),
            currency: pricing.currency,
            region: { id: Number(region.id), name: region.name, type: region.type, country_code: region.countryCode },
        },
        total_hotels: serp.total_hotels,
        total_available: hotels.length,
        total_filtered: filtered.length,
        page: currentPage,
        page_size: pageSize,
        total_pages: totalPages,
        filters: availableFilters(hotels, filters),
        hotels: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        expires_at: serp.expires_at,
    }
}

// ------------------------------------------------------------------ 2.2 hotelpage

const hotelPageKey = (hid, params) => hashKey("hp", { hid, ...params })

/** Net (supplier-priced) hotelpage rates, cached per hotel and stay */
async function fetchHotelPage(hid, params) {
    const key = hotelPageKey(hid, params)
    const cached = cache.get(key)
    if (cached) return cached

    const exists = await db.Hotels.count({ where: { hid, contentStatus: HotelContentStatus.synced, deleted: false } })
    if (!exists) throw new HotelServiceError(404, "Hotel not found", "hotel_not_found")

    const response = await ratehawkConfig.post({
        endpoint: ratehawkConfig.apis.b2b_search_hotel_page,
        data: { ...etgStayPayload(params), hid },
        timeout: RT_TIMEOUTS.search,
    })

    const now = Date.now()
    const rates = (response.data?.hotels?.[0]?.rates ?? [])
        .map(normalizeRate)
        .filter((rate) => rate.book_hash && !rate.is_package && rate.payment?.show_amount !== null)
        .sort((a, b) => a.payment.show_amount - b.payment.show_amount)

    const result = {
        hid,
        search: staySummary(params),
        rates,
        fetched_at: new Date(now).toISOString(),
        expires_at: new Date(now + HOTELPAGE_CACHE_TTL * 1000).toISOString(),
    }
    cacheSet(key, result, HOTELPAGE_CACHE_TTL)
    return result
}

export async function getHotelRates(hid, params, viewerCountry) {
    const [hotelPage, pricing] = await Promise.all([fetchHotelPage(hid, params), getHotelPricing(viewerCountry)])
    return {
        ...hotelPage,
        search: { ...hotelPage.search, currency: pricing.currency },
        rates: hotelPage.rates.map((rate) => priceRate(rate, pricing)),
    }
}

// ------------------------------------------------------------------ 3.1 prebook from hotelpage

const PREBOOK_ERRORS = {
    rate_not_found: [409, "This rate is no longer available. Please refresh the rates and choose again."],
    no_available_rates: [409, "This room has just sold out. Please choose another rate."],
    contract_mismatch: [409, "This rate can no longer be booked. Please choose another rate."],
}

function serializePrebook(prebook) {
    return {
        id: prebook.id,
        hid: Number(prebook.hid),
        hotel_name: prebook.hotelName,
        book_hash: prebook.bookHash,
        price_changed: prebook.priceChanged,
        original_amount: prebook.originalAmount === null ? null : Number(prebook.originalAmount),
        amount: Number(prebook.amount),
        currency: prebook.currency,
        checkin: prebook.checkin,
        checkout: prebook.checkout,
        residency: prebook.residency,
        guests: prebook.guests,
        rate: prebook.rate,
        expires_at: prebook.expiresAt,
        created_at: prebook.createdAt,
    }
}

/**
 * The rate must come from a hotelpage response we served for exactly this hotel and stay;
 * the stored prebook therefore never relies on stay details or prices sent by the client.
 */
export async function prebookRate(hid, params, bookHash, viewerCountry) {
    const hotelPage = cache.get(hotelPageKey(hid, params))
    const servedRate = hotelPage?.rates.find((rate) => rate.book_hash === bookHash)
    if (!servedRate) {
        throw new HotelServiceError(409, "Rates for this stay have expired. Please refresh the rates and choose again.", "rate_expired")
    }

    let response
    try {
        response = await ratehawkConfig.post({
            endpoint: ratehawkConfig.apis.b2b_hotel_prebook,
            data: { hash: bookHash, price_increase_percent: PREBOOK_PRICE_INCREASE_PERCENT },
            timeout: RT_TIMEOUTS.prebook,
        })
    } catch (error) {
        const known = error instanceof RatehawkError && PREBOOK_ERRORS[error.code]
        if (known) {
            // Availability changed: the cached hotelpage is stale
            cache.del(hotelPageKey(hid, params))
            throw new HotelServiceError(known[0], known[1], error.code)
        }
        throw error
    }

    const raw = response.data?.hotels?.[0]?.rates?.[0]
    if (!raw?.book_hash) {
        throw new HotelServiceError(409, PREBOOK_ERRORS.no_available_rates[1], "no_available_rates")
    }

    const rate = normalizeRate(raw)
    const original = servedRate.payment
    // Compare like for like: same payment type the guest saw on the hotel page
    const netPayment = rate.payment_types.find((item) => item.type === original?.type) ?? rate.payment
    const [hotel, pricing] = await Promise.all([
        db.Hotels.findByPk(hid, { attributes: ["name"] }),
        getHotelPricing(viewerCountry),
    ])
    const pricedRate = priceRate({ ...rate, payment: netPayment }, pricing)

    const prebook = await db.HotelPrebooks.create({
        hid,
        hotelName: hotel?.name ?? null,
        requestedHash: bookHash,
        bookHash: rate.book_hash,
        priceIncreasePercent: PREBOOK_PRICE_INCREASE_PERCENT,
        // Price changes are detected on supplier (net) amounts; the guest sees selling amounts
        priceChanged: Boolean(response.data?.changes?.price_changed) || netPayment.show_amount !== original?.show_amount,
        originalAmount: original ? sellingAmount(original.show_amount, pricing) : null,
        amount: pricedRate.payment.show_amount,
        currency: pricing.currency,
        netAmount: netPayment.show_amount,
        netCurrency: netPayment.show_currency,
        contractAmount: netPayment.amount,
        contractCurrency: netPayment.currency,
        exchangeRate: pricing.exchangeRate,
        markup: pricing.markup,
        checkin: params.checkin,
        checkout: params.checkout,
        residency: params.residency,
        guests: params.guests,
        rate: pricedRate,
        expiresAt: dayjs().add(PREBOOK_VALIDITY_MINUTES, "minute").toDate(),
    })

    return serializePrebook(prebook)
}

export async function getPrebook(id) {
    const prebook = await db.HotelPrebooks.findByPk(id)
    if (!prebook) throw new HotelServiceError(404, "Reservation not found", "prebook_not_found")
    return { ...serializePrebook(prebook), is_expired: new Date(prebook.expiresAt).getTime() <= Date.now() }
}
