import db from "../repository/hotels.repository.js"
import logger from "../../../middleware/logger.js"
import { MainStatusOptions, MarkupOptions, roundDecimal, roundUpAmount, safeParse } from "../../../config/utilities.js"

/**
 * Turns ETG net prices (always requested in USD) into the selling prices shown to a viewer:
 *   1. apply the admin-managed HOTEL markup and VAT (Markups table)
 *   2. convert to NGN with the active exchange rate (Rates table) - only for viewers in Nigeria
 *
 * Amounts paid directly at the hotel (local taxes, deposits, no-show fees) are the
 * hotel's charges in its own currency and are deliberately left untouched.
 */

export const SUPPLIER_CURRENCY = "USD"
const NIGERIA_CODES = ["ng", "nga", "ngn"]

export function isNigerianViewer(viewerCountry) {
    return NIGERIA_CODES.includes(String(viewerCountry ?? "").toLowerCase())
}

/**
 * @param {string|null|undefined} viewerCountry - ISO country code of the visitor (from the frontend geolocation)
 */
export async function getHotelPricing(viewerCountry) {
    const isNigeria = isNigerianViewer(viewerCountry)
    const [rate, markup] = await Promise.all([
        isNigeria ? db.Rates.findOne({ where: { status: MainStatusOptions.true } }) : null,
        db.Markups.findOne({ where: { tag: MarkupOptions.hotel, status: MainStatusOptions.true } }),
    ])

    // Rate quotes are stored as [{ quote: "USD", value: <NGN per 1 USD> }]
    const quotes = rate ? safeParse(rate.quotes) : []
    const ngnPerUsd = Number((Array.isArray(quotes) ? quotes : []).find((item) => item.quote === SUPPLIER_CURRENCY)?.value)
    const convert = isNigeria && ngnPerUsd > 0
    if (isNigeria && !convert) {
        logger.warn("[hotels] no active USD exchange rate configured; showing hotel prices in USD to a Nigerian viewer")
    }

    return {
        currency: convert ? "NGN" : SUPPLIER_CURRENCY,
        exchangeRate: convert ? ngnPerUsd : 1,
        markup: markup
            ? { type: markup.discountType, value: Number(markup.discountValue) || 0, vat: Number(markup.vat) || 0 }
            : null,
    }
}

/** Selling price for a net supplier amount (USD). FIXED markups are a flat USD amount per stay. */
export function sellingAmount(netAmount, pricing) {
    if (netAmount === null || netAmount === undefined || !Number.isFinite(netAmount)) return null
    const markup = pricing.markup
    let amount = netAmount
    if (markup) {
        const markupAmount = markup.type === "FIXED" ? markup.value : (netAmount * markup.value) / 100
        // VAT is charged on the net amount, consistent with displayMarkupPercent used by the other services
        amount = netAmount + markupAmount + (netAmount * markup.vat) / 100
    }
    return roundUpAmount(amount * pricing.exchangeRate)
}

// Amounts derived from the total (nightly breakdown, cancellation fees) keep the same proportion
const scaleWith = (value, netTotal, sellingTotal) => {
    if (value === null || value === undefined || !netTotal) return value ?? null
    return roundDecimal((value * sellingTotal) / netTotal, 2)
}

function pricePayment(payment, pricing) {
    if (!payment) return payment
    if (payment.show_currency && payment.show_currency !== SUPPLIER_CURRENCY) {
        logger.warn(`[hotels] unexpected supplier currency ${payment.show_currency}; price left unconverted`)
        return payment
    }
    const net = payment.show_amount
    const selling = sellingAmount(net, pricing)
    return {
        ...payment,
        // The contract (net) amount is internal and never exposed to viewers
        amount: selling,
        currency: pricing.currency,
        show_amount: selling,
        show_currency: pricing.currency,
        cancellation_policies: payment.cancellation_policies.map((policy) => ({
            ...policy,
            amount_show: scaleWith(policy.amount_show, net, selling),
            amount_charge: scaleWith(policy.amount_charge, net, selling),
        })),
    }
}

/** Applies pricing to a normalised rate (see rate-normalizer.js) */
export function priceRate(rate, pricing) {
    const payment = pricePayment(rate.payment, pricing)
    return {
        ...rate,
        payment,
        payment_types: rate.payment_types.map((item) => pricePayment(item, pricing)),
        daily_prices: rate.daily_prices.map((value) => scaleWith(value, rate.payment?.show_amount, payment?.show_amount)),
    }
}

/** Applies pricing to a search summary hotel (see summariseSerpHotel) */
export function priceSerpHotel(hotel, pricing) {
    return {
        ...hotel,
        min_price: sellingAmount(hotel.min_price, pricing),
        currency: pricing.currency,
        rates: hotel.rates.map((rate) => ({
            ...rate,
            payment: { ...rate.payment, show_amount: sellingAmount(rate.payment.show_amount, pricing), show_currency: pricing.currency },
        })),
    }
}
