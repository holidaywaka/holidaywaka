import db from "../repository/dashboard.repository.js"
import { MainStatusOptions, MarkupOptions, ServerTransactionStatusOptions, TransactionTypes } from "../../../config/utilities.js"

/**
 * Shared building blocks for the admin dashboard and insights.
 * A "business line" is what the business sells; transactions are mapped onto one by txType.
 */

export const BUSINESS_LINES = [
    { key: "hotels", label: "Hotels", txTypes: ["HOTEL"], markupTag: MarkupOptions.hotel },
    { key: "packages", label: "Holiday packages", txTypes: [TransactionTypes.trip], markupTag: MarkupOptions.package },
    { key: "visa", label: "Visa", txTypes: [TransactionTypes.visa], markupTag: MarkupOptions.visa },
    // Chauffeur bookings are iWay transfers priced with the airport transfer markup
    { key: "transfers", label: "Airport transfers", txTypes: [TransactionTypes.transfer, TransactionTypes.chauffeur], markupTag: MarkupOptions.airport },
]

export const lineForTxType = (txType) => BUSINESS_LINES.find((line) => line.txTypes.includes(txType)) ?? null

export const PAID_STATUSES = [ServerTransactionStatusOptions.paid]
export const AWAITING_STATUSES = [ServerTransactionStatusOptions.pending, ServerTransactionStatusOptions.submitted, ServerTransactionStatusOptions.part_paid]

/** What the customer was charged, in NGN (USD charges converted with the rate stored on the transaction) */
export function chargeInNaira(tx) {
    const charge = tx.charge && !Array.isArray(tx.charge) ? tx.charge : {}
    const amount = Number(charge.amount ?? tx.amount) || 0
    const currency = String(charge.currency ?? "NGN").toUpperCase()
    if (currency === "NGN" || currency === "NG") return amount
    const rate = Number(charge.rate)
    return rate > 0 ? amount * rate : amount
}

/** Active markup per business line, used when a transaction did not record its own */
export async function currentMarkups() {
    const markups = await db.Markups.findAll({ where: { status: MainStatusOptions.true }, raw: true })
    return Object.fromEntries(BUSINESS_LINES.map((line) => {
        const markup = markups.find((item) => item.tag === line.markupTag)
        return [line.key, markup ? { value: Number(markup.discountValue) || 0, vat: Number(markup.vat) || 0 } : { value: 0, vat: 0 }]
    }))
}

/**
 * Splits a charged amount into our margin (markup) and VAT.
 * Prices are built as base * (1 + (markup + vat) / 100), so both shares are recovered from the total.
 */
export function splitCharge(tx, naira, markups) {
    const charge = tx.charge && !Array.isArray(tx.charge) ? tx.charge : {}
    const recorded = charge.markup_value !== undefined && charge.markup_value !== null
    const line = lineForTxType(tx.txType)
    const markup = recorded ? Number(charge.markup_value) || 0 : markups[line?.key]?.value ?? 0
    const vat = recorded ? Number(charge.vat) || 0 : markups[line?.key]?.vat ?? 0
    const divisor = 100 + markup + vat
    return {
        margin: (naira * markup) / divisor,
        vat: (naira * vat) / divisor,
        estimated: !recorded,
    }
}

/** Loads transactions in a window and enriches them with NGN value, margin and business line */
export async function loadTransactions(where, markups, attributes = []) {
    const rows = await db.Transactions.findAll({
        where,
        attributes: ["id", "txid", "txType", "amount", "charge", "paymentStatus", "paymentType", "tripId", "visaId", "transferId", "createdAt", ...attributes],
        order: [["createdAt", "DESC"]],
    })
    return rows.map((tx) => {
        const naira = chargeInNaira(tx)
        const split = splitCharge(tx, naira, markups)
        return {
            id: tx.id,
            txid: tx.txid,
            txType: tx.txType,
            line: lineForTxType(tx.txType)?.key ?? null,
            paymentStatus: tx.paymentStatus,
            paymentType: tx.paymentType,
            tripId: tx.tripId,
            visaId: tx.visaId,
            transferId: tx.transferId,
            createdAt: tx.createdAt,
            naira,
            margin: split.margin,
            vat: split.vat,
            marginEstimated: split.estimated,
            isPaid: PAID_STATUSES.includes(tx.paymentStatus),
            isAwaiting: AWAITING_STATUSES.includes(tx.paymentStatus),
        }
    })
}
