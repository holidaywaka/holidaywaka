import dayjs from "dayjs"
import db from "../repository/trips.repository.js"
import CustomError from "../../../middleware/custom-error.js"
import { displayMarkupPercent, IsNaira, MainStatusOptions, MarkupOptions, roundUpAmount, TransactionTypes } from "../../../config/utilities.js"
import { findUsableVoucher, voucherDiscount } from "../../vouchers/services/voucher.service.js"

/**
 * Package prices are stored per price type in NGN (e.g. "Per Person Sharing", "Solo/ Single occupancy").
 * Every traveller's price is resolved here from the trip itself; the client only says which price type it chose.
 */

export const TRIP_TYPES = { private: "PRIVATE", group: "GROUP" }
const SOLO_PATTERN = /solo|single/i

export const isSoloPriceType = (priceType) => SOLO_PATTERN.test(String(priceType ?? ""))
const isAdult = (traveler) => /^adult/i.test(String(traveler?.tag ?? ""))

/** Adds working days (Mon-Fri), starting the count on the next day */
export function addBusinessDays(date, days) {
    let current = dayjs(date).startOf("day")
    let added = 0
    while (added < days) {
        current = current.add(1, "day")
        const weekday = current.day()
        if (weekday !== 0 && weekday !== 6) added++
    }
    return current
}

/**
 * Earliest date the customer can travel when the package needs a visa: the visa is ready after
 * `visaProcessingDays` working days, and travel is the day after it is ready.
 */
export function earliestTravelDate(trip, from = dayjs()) {
    if (!trip?.visaRequired || !(Number(trip.visaProcessingDays) > 0)) return null
    return addBusinessDays(from, Number(trip.visaProcessingDays)).add(1, "day")
}

export function assertVisaLeadTime(trip, travelDate) {
    const earliest = earliestTravelDate(trip)
    if (!earliest) return
    const date = dayjs(travelDate)
    if (!date.isValid() || date.isBefore(earliest, "day")) {
        const days = Number(trip.visaProcessingDays)
        throw new CustomError(400, trip.tripType === TRIP_TYPES.group
            ? `This departure is too soon: the visa takes ${days} working days to process, so the earliest possible travel date is ${earliest.format("D MMM YYYY")}.`
            : `The visa for this package takes ${days} working days to process. Please choose a travel date on or after ${earliest.format("D MMM YYYY")}.`)
    }
}

/** Resolves each traveller's price type and NGN price from the trip */
export function priceTravelers(trip, travelers = []) {
    const prices = (trip.prices ?? []).map((item) => ({ priceType: String(item.priceType ?? "").trim(), price: Number(item.price) }))
    if (!prices.length) throw new CustomError(400, "This package has no prices set yet")
    const adults = travelers.filter(isAdult)
    const solo = prices.find((item) => isSoloPriceType(item.priceType))
    // Private trip for one adult: the solo price applies and cannot be changed
    const forceSolo = trip.tripType === TRIP_TYPES.private && adults.length === 1 && Boolean(solo)

    return travelers.map((traveler) => {
        let entry = forceSolo && isAdult(traveler)
            ? solo
            : prices.find((item) => item.priceType === String(traveler.priceType ?? "").trim())
        // Older clients only sent the amount shown; accept it only if it is one of the trip's NGN prices
        if (!entry && traveler.priceAmount !== undefined) entry = prices.find((item) => String(item.price) === String(traveler.priceAmount))
        if (!entry) throw new CustomError(400, `Please choose a price for ${traveler.tag ?? "each traveller"}`)
        return { ...traveler, priceType: entry.priceType, baseAmount: entry.price, priceAmount: String(entry.price) }
    })
}

/**
 * Full price breakdown in NGN and in the viewer's currency, with an optional voucher.
 * @returns {{ travelers, subtotal, markup, total, currency, rate, chargeAmount, discount, payable, voucher }}
 */
export async function quotePackage({ trip, travelers, currency, voucherCode }) {
    const [rate, markup] = await Promise.all([
        db.Rates.findOne({ where: { status: MainStatusOptions.true } }),
        db.Markups.findOne({ where: { tag: MarkupOptions.package, status: MainStatusOptions.true } }),
    ])
    const isNg = IsNaira({ role: null }, rate, currency)
    const ngnPerUsd = Number(isNg.getRate?.value || 1)

    const priced = priceTravelers(trip, travelers)
    const subtotal = priced.reduce((sum, traveler) => sum + traveler.baseAmount, 0)
    const total = markup?.id ? displayMarkupPercent(subtotal, markup.discountValue, markup.vat) : subtotal

    const chargeCurrency = isNg.status ? "NGN" : isNg.currency
    const toCharge = (naira) => roundUpAmount(chargeCurrency === "NGN" ? naira : naira / ngnPerUsd)
    const chargeAmount = toCharge(total)

    const voucher = voucherCode ? await findUsableVoucher(voucherCode, TransactionTypes.trip) : null
    const discount = voucher ? voucherDiscount(voucher, chargeAmount, chargeCurrency, ngnPerUsd) : 0

    return {
        travelers: priced,
        subtotal,
        markup: markup?.id ? { value: Number(markup.discountValue) || 0, vat: Number(markup.vat) || 0 } : { value: 0, vat: 0 },
        total,
        currency: chargeCurrency,
        rate: ngnPerUsd,
        chargeAmount,
        discount,
        payable: Math.max(0, chargeAmount - discount),
        voucher,
        earliestTravelDate: earliestTravelDate(trip)?.format("YYYY-MM-DD") ?? null,
    }
}
