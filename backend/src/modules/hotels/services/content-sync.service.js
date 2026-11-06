import { Op } from "sequelize"
import db from "../repository/hotels.repository.js"
import ratehawkConfig, { rtConfigs } from "./ratwhawk.config.js"
import logger from "../../../middleware/logger.js"
import { HotelContentStatus } from "../../../database/models/hotelModel.js"
import { HotelStaticDataKeys } from "../../../database/models/hotelStaticDataModel.js"
import { HotelSyncScopes, HotelSyncStatus } from "../../../database/models/hotelSyncLogModel.js"

/**
 * Step 1 of the ETG integration flow: keep static hotel content in our own database.
 * https://docs.emergingtravel.com/docs/integration-guide/
 *
 * The Content API must only be used as a separate synchronisation flow - never
 * together with, or in parallel to, search / hotelpage requests. Everything in
 * this file therefore runs from the scheduler, the admin endpoint or the CLI script.
 */

const CONTENT_BATCH_SIZE = 100 // hotel_content_by_ids accepts at most 100 hids
const IDS_UPSERT_CHUNK = 1000
const HOTEL_WRITE_CHUNK = 10
const CONTENT_LANGUAGE = process.env.RATEHAWK_CONTENT_LANGUAGE || "en"
// Default pacing keeps us under the sandbox quota of 30 content requests / minute
const CONTENT_REQUEST_INTERVAL_MS = Number(process.env.RATEHAWK_CONTENT_INTERVAL_MS || 2100)
const IDS_REQUEST_INTERVAL_MS = Number(process.env.RATEHAWK_IDS_INTERVAL_MS || 6100)
const CONTENT_MAX_PER_RUN = Number(process.env.RATEHAWK_CONTENT_MAX_PER_RUN || 5000)
const MAX_RATE_LIMIT_RETRIES = 3
// Sandbox only accepts these country values in hotel_ids_by_filter
const SANDBOX_COUNTRIES = [59, 189, 201]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const chunk = (items, size) => {
    const out = []
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
    return out
}

// ETG expects "2006-01-02 15:04:05" (UTC)
const toEtgTimestamp = (date) => date.toISOString().replace("T", " ").slice(0, 19)

export function getSyncCountries() {
    const configured = (process.env.RATEHAWK_SYNC_COUNTRIES || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    if (configured.length > 0) return configured
    if (rtConfigs.apiUrl?.includes("sandbox")) return SANDBOX_COUNTRIES
    return []
}

async function withRateLimitRetry(fn, label) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (!error.isRateLimited || attempt >= MAX_RATE_LIMIT_RETRIES) throw error
            const wait = 60_000 * (attempt + 1)
            logger.warn(`[hotel-sync] ${label} rate limited, retrying in ${wait / 1000}s`)
            await sleep(wait)
        }
    }
}

// ------------------------------------------------------------------ 1.1 + 1.2

export async function syncStaticData() {
    const stats = { filter_values: false, hotel_static: false }

    const filters = await withRateLimitRetry(
        () => ratehawkConfig.fetch({ endpoint: ratehawkConfig.apis.filter_values }),
        "filter_values"
    )
    await db.HotelStaticData.upsert({ key: HotelStaticDataKeys.filter_values, data: filters.data, syncedAt: new Date() })
    stats.filter_values = true

    // Recommended (not required) by ETG; failure must not block the rest of the sync
    try {
        const hotelStatic = await withRateLimitRetry(
            () => ratehawkConfig.fetch({ endpoint: ratehawkConfig.apis.hotel_static }),
            "hotel_static"
        )
        await db.HotelStaticData.upsert({ key: HotelStaticDataKeys.hotel_static, data: hotelStatic.data, syncedAt: new Date() })
        stats.hotel_static = true
    } catch (error) {
        logger.warn(`[hotel-sync] hotel static data skipped: ${error.message}`)
    }

    return stats
}

// ------------------------------------------------------------------ 1.3

/**
 * Registers hotel ids as pending so the content step picks them up.
 * @param {number[]} hids
 * @param {{ refreshExisting?: boolean }} options - re-queue hids we already hold (they were updated upstream)
 */
export async function queueHotelsForContent(hids, { refreshExisting = false } = {}) {
    let queued = 0
    let refreshed = 0

    for (const part of chunk([...new Set(hids)], IDS_UPSERT_CHUNK)) {
        const existing = await db.Hotels.findAll({ where: { hid: part }, attributes: ["hid"], raw: true })
        const existingSet = new Set(existing.map((row) => Number(row.hid)))
        const fresh = part.filter((hid) => !existingSet.has(hid))

        if (fresh.length > 0) {
            await db.Hotels.bulkCreate(
                fresh.map((hid) => ({ hid, contentStatus: HotelContentStatus.pending })),
                { ignoreDuplicates: true }
            )
            queued += fresh.length
        }

        if (refreshExisting && existingSet.size > 0) {
            const [count] = await db.Hotels.update(
                { contentStatus: HotelContentStatus.pending },
                { where: { hid: [...existingSet] } }
            )
            refreshed += count
        }
    }

    return { queued, refreshed }
}

export async function syncHotelIds({ countries = getSyncCountries(), updatedSince = null } = {}) {
    const stats = { countries: {}, queued: 0, refreshed: 0 }
    if (countries.length === 0) {
        logger.warn("[hotel-sync] RATEHAWK_SYNC_COUNTRIES is empty, hotel id discovery skipped")
        return stats
    }

    for (const [index, country] of countries.entries()) {
        if (index > 0) await sleep(IDS_REQUEST_INTERVAL_MS)

        const response = await withRateLimitRetry(
            () => ratehawkConfig.post({
                endpoint: ratehawkConfig.apis.hotel_ids_by_filter,
                data: {
                    country: [country],
                    ...(updatedSince ? { updated_since: toEtgTimestamp(updatedSince) } : {}),
                },
            }),
            `hotel_ids_by_filter(${country})`
        )

        const hids = (response.data?.hids ?? []).map(Number).filter(Boolean)
        const result = await queueHotelsForContent(hids, { refreshExisting: Boolean(updatedSince) })
        stats.countries[country] = hids.length
        stats.queued += result.queued
        stats.refreshed += result.refreshed
    }

    return stats
}

// ------------------------------------------------------------------ 1.4

function mapContentToHotel(content, syncedAt) {
    return {
        hid: content.hid,
        legacyId: content.id ?? null,
        name: content.name ?? null,
        kind: content.kind ?? null,
        starRating: Number(content.star_rating ?? 0),
        hotelChain: content.hotel_chain ?? null,
        address: content.address ?? null,
        postalCode: content.postal_code ?? null,
        phone: content.phone ?? null,
        email: content.email ?? null,
        latitude: content.latitude ?? null,
        longitude: content.longitude ?? null,
        regionId: content.region?.id ?? null,
        countryCode: content.region?.country_code ?? null,
        checkInTime: content.check_in_time ?? null,
        checkInTimeEnd: content.check_in_time_end ?? null,
        checkOutTime: content.check_out_time ?? null,
        frontDeskTimeStart: content.front_desk_time_start ?? null,
        frontDeskTimeEnd: content.front_desk_time_end ?? null,
        isClosed: Boolean(content.is_closed),
        deleted: Boolean(content.deleted),
        isGenderSpecificationRequired: Boolean(content.is_gender_specification_required),
        images: content.images_ext ?? [],
        amenityGroups: content.amenity_groups ?? [],
        descriptionStruct: content.description_struct ?? [],
        metapolicyStruct: content.metapolicy_struct ?? null,
        metapolicyExtraInfo: content.metapolicy_extra_info ?? null,
        policyStruct: content.policy_struct ?? [],
        roomGroups: content.room_groups ?? [],
        serpFilters: content.serp_filters ?? [],
        facts: content.facts ?? null,
        keysPickup: content.keys_pickup ?? null,
        paymentMethods: content.payment_methods ?? null,
        starCertificate: content.star_certificate ?? null,
        language: CONTENT_LANGUAGE,
        contentStatus: HotelContentStatus.synced,
        contentSyncedAt: syncedAt,
    }
}

const HOTEL_UPDATE_FIELDS = [
    "legacyId", "name", "kind", "starRating", "hotelChain", "address", "postalCode", "phone", "email",
    "latitude", "longitude", "regionId", "countryCode", "checkInTime", "checkInTimeEnd", "checkOutTime",
    "frontDeskTimeStart", "frontDeskTimeEnd", "isClosed", "deleted", "isGenderSpecificationRequired",
    "images", "amenityGroups", "descriptionStruct", "metapolicyStruct", "metapolicyExtraInfo", "policyStruct",
    "roomGroups", "serpFilters", "facts", "keysPickup", "paymentMethods", "starCertificate", "language",
    "contentStatus", "contentSyncedAt", "updatedAt",
]

async function storeContentBatch(hids) {
    const response = await withRateLimitRetry(
        () => ratehawkConfig.post({
            endpoint: ratehawkConfig.apis.hotel_content_by_ids,
            data: { hids, language: CONTENT_LANGUAGE },
        }),
        "hotel_content_by_ids"
    )

    const syncedAt = new Date()
    const contents = (response.data ?? []).filter((item) => item?.hid)
    const regions = new Map()

    for (const content of contents) {
        if (content.region?.id) {
            regions.set(content.region.id, {
                id: content.region.id,
                name: content.region.name ?? null,
                type: content.region.type ?? null,
                countryCode: content.region.country_code ?? null,
                iata: content.region.iata ?? null,
            })
        }
    }

    await db.sequelize.transaction(async (transaction) => {
        if (regions.size > 0) {
            await db.HotelRegions.bulkCreate([...regions.values()], {
                updateOnDuplicate: ["name", "type", "countryCode", "iata", "updatedAt"],
                transaction,
            })
        }
        // A single hotel can carry ~100KB of JSON; small statements stay under max_allowed_packet
        for (const part of chunk(contents, HOTEL_WRITE_CHUNK)) {
            await db.Hotels.bulkCreate(part.map((content) => mapContentToHotel(content, syncedAt)), {
                updateOnDuplicate: HOTEL_UPDATE_FIELDS,
                transaction,
            })
        }

        // Anything ETG did not return has no content; stop retrying it every run
        const returned = new Set(contents.map((content) => Number(content.hid)))
        const missing = hids.filter((hid) => !returned.has(hid))
        if (missing.length > 0) {
            await db.Hotels.update(
                { contentStatus: HotelContentStatus.unavailable, contentSyncedAt: syncedAt },
                { where: { hid: missing }, transaction }
            )
        }
    })

    return { stored: contents.length, unavailable: hids.length - contents.length, regionIds: [...regions.keys()] }
}

async function refreshRegionCounts(regionIds) {
    for (const part of chunk(regionIds, 500)) {
        const counts = await db.Hotels.findAll({
            attributes: ["regionId", [db.sequelize.fn("COUNT", db.sequelize.col("hid")), "total"]],
            where: { regionId: part, contentStatus: HotelContentStatus.synced, deleted: false },
            group: ["regionId"],
            raw: true,
        })
        const byRegion = new Map(counts.map((row) => [Number(row.regionId), Number(row.total)]))
        for (const regionId of part) {
            await db.HotelRegions.update({ hotelsCount: byRegion.get(Number(regionId)) ?? 0 }, { where: { id: regionId } })
        }
    }
}

export async function syncHotelContent({ maxHotels = CONTENT_MAX_PER_RUN } = {}) {
    const stats = { stored: 0, unavailable: 0, batches: 0 }
    const touchedRegions = new Set()
    let lastHid = 0

    while (stats.stored + stats.unavailable < maxHotels) {
        const pending = await db.Hotels.findAll({
            where: { contentStatus: HotelContentStatus.pending, hid: { [Op.gt]: lastHid } },
            attributes: ["hid"],
            order: [["hid", "ASC"]],
            limit: Math.min(CONTENT_BATCH_SIZE, maxHotels - stats.stored - stats.unavailable),
            raw: true,
        })
        if (pending.length === 0) break

        const hids = pending.map((row) => Number(row.hid))
        lastHid = hids[hids.length - 1]
        if (stats.batches > 0) await sleep(CONTENT_REQUEST_INTERVAL_MS)

        const result = await storeContentBatch(hids)
        stats.batches += 1
        stats.stored += result.stored
        stats.unavailable += result.unavailable
        result.regionIds.forEach((id) => touchedRegions.add(id))
    }

    await refreshRegionCounts([...touchedRegions])
    stats.pending = await db.Hotels.count({ where: { contentStatus: HotelContentStatus.pending } })
    return stats
}

// ------------------------------------------------------------------ orchestration

/** @type {Promise<{ log: any, done: Promise<any> }> | null} */
let activeSync = null

async function lastSuccessfulIdsSync() {
    return db.HotelSyncLogs.findOne({
        where: { scope: [HotelSyncScopes.ids, HotelSyncScopes.full], status: HotelSyncStatus.success },
        order: [["startedAt", "DESC"]],
    })
}

async function executeSync(log, scope, options) {
    const stats = {}
    try {
        if (scope === HotelSyncScopes.static || scope === HotelSyncScopes.full) {
            stats.static = await syncStaticData()
        }
        if (scope === HotelSyncScopes.ids || scope === HotelSyncScopes.full) {
            // Incremental after the first successful discovery run
            const previous = options.fullDiscovery ? null : await lastSuccessfulIdsSync()
            stats.ids = await syncHotelIds({
                countries: options.countries?.length ? options.countries : getSyncCountries(),
                updatedSince: previous?.startedAt ?? null,
            })
        }
        if (scope === HotelSyncScopes.content || scope === HotelSyncScopes.full) {
            stats.content = await syncHotelContent({ maxHotels: options.maxHotels })
        }
        await log.update({ status: HotelSyncStatus.success, stats, finishedAt: new Date() })
        logger.info(`[hotel-sync] ${scope} finished ${JSON.stringify(stats)}`)
    } catch (error) {
        await log.update({ status: HotelSyncStatus.failed, stats, error: error.message, finishedAt: new Date() })
        logger.error(`[hotel-sync] ${scope} failed: ${error.message}`)
    }
    return log
}

/**
 * Starts a sync run. Only one run executes at a time per process; a concurrent
 * request receives the log of the run already in progress.
 * @param {keyof typeof HotelSyncScopes} scope
 * @param {{ countries?: number[], maxHotels?: number, fullDiscovery?: boolean, wait?: boolean }} options
 * @returns {Promise<{ log: any, alreadyRunning: boolean }>}
 */
export async function runHotelSync(scope, options = {}) {
    if (activeSync) {
        const { log } = await activeSync
        return { log, alreadyRunning: true }
    }

    // Assigned synchronously so concurrent callers see the lock before any await
    activeSync = startSync(scope, options)
    const { log, done } = await activeSync
    if (options.wait) await done
    return { log, alreadyRunning: false }
}

async function startSync(scope, { wait, ...params }) {
    let log
    try {
        log = await db.HotelSyncLogs.create({
            scope,
            status: HotelSyncStatus.running,
            params,
            startedAt: new Date(),
        })
    } catch (error) {
        activeSync = null
        throw error
    }
    const done = executeSync(log, scope, params).finally(() => { activeSync = null })
    return { log, done }
}

export async function hasPendingHotelContent() {
    const pending = await db.Hotels.count({ where: { contentStatus: HotelContentStatus.pending } })
    return pending > 0
}
