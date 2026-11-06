import { Op } from "sequelize"
import db from "../repository/payments.repository.js"
import logger from "../../../middleware/logger.js"
import CustomError from "../../../middleware/custom-error.js"
import { getUpTransaction } from "./createPayment.js"
import {
    ServerTransactionMainStatus,
    ServerTransactionPaymentType,
    ServerTransactionStatusOptions,
    TransactionTypes,
} from "../../../config/utilities.js"
import { MailKinds, sendTransactionMail } from "../../notifications/services/transaction-mail.js"
import { settleVoucher } from "../../vouchers/services/voucher.service.js"

/**
 * Single place where a transaction becomes paid or declined, whatever the trigger
 * (Unified Payment webhook, the customer's verify page, or an admin confirming a bank transfer).
 * Transitions are atomic and idempotent, so follow-ups (emails, vouchers, hotel booking) run exactly once.
 */

const { paid: PAID, declined: DECLINED, part_paid: PART_PAID, pending: PENDING } = ServerTransactionStatusOptions

// Hotel fulfilment is loaded lazily to keep the import graph acyclic
async function afterPaid(transaction) {
    await settleVoucher(transaction, "paid")
    if (transaction.txType === TransactionTypes.hotel && transaction.hotelBookingId) {
        const { startHotelBooking } = await import("../../hotels/services/hotel-booking.service.js")
        startHotelBooking(transaction.hotelBookingId).catch((error) => logger.error(`[hotel-booking] start failed for ${transaction.hotelBookingId}: ${error.message}`))
    }
}

async function afterDeclined(transaction) {
    await settleVoucher(transaction, "declined")
    if (transaction.txType === TransactionTypes.hotel && transaction.hotelBookingId) {
        const { markBookingPaymentDeclined } = await import("../../hotels/services/hotel-booking.service.js")
        await markBookingPaymentDeclined(transaction.hotelBookingId)
    }
}

const resolve = async (transactionOrId) =>
    typeof transactionOrId === "string" ? db.Transactions.findByPk(transactionOrId) : transactionOrId

/** @returns {Promise<{ changed: boolean, transaction }>} */
export async function markTransactionPaid(transactionOrId, { source = "system" } = {}) {
    const transaction = await resolve(transactionOrId)
    if (!transaction) throw new CustomError(404, "Transaction not found")

    const [count] = await db.Transactions.update(
        { paymentStatus: PAID, status: ServerTransactionMainStatus.close, declineReason: null },
        { where: { id: transaction.id, paymentStatus: { [Op.ne]: PAID } } }
    )
    await transaction.reload()
    if (count === 0) return { changed: false, transaction }

    logger.info(`[payments] transaction ${transaction.id} (${transaction.txType}) marked PAID via ${source}`)
    await afterPaid(transaction)
    await notifyOnce(transaction, MailKinds.paid)
    return { changed: true, transaction }
}

/** A declined payment never overrides a confirmed one */
export async function markTransactionDeclined(transactionOrId, { reason = null, source = "system" } = {}) {
    const transaction = await resolve(transactionOrId)
    if (!transaction) throw new CustomError(404, "Transaction not found")

    const [count] = await db.Transactions.update(
        { paymentStatus: DECLINED, status: ServerTransactionMainStatus.open, declineReason: reason },
        { where: { id: transaction.id, paymentStatus: { [Op.notIn]: [PAID, DECLINED] } } }
    )
    await transaction.reload()
    if (count === 0) return { changed: false, transaction }

    logger.info(`[payments] transaction ${transaction.id} (${transaction.txType}) marked DECLINED via ${source}: ${reason ?? "no reason"}`)
    await afterDeclined(transaction)
    await notifyOnce(transaction, MailKinds.declined, { reason })
    return { changed: true, transaction }
}

/** Paid/declined emails are sent once per status, even if webhook and verify race each other */
async function notifyOnce(transaction, kind, extra = {}) {
    const [count] = await db.Transactions.update(
        { notifiedStatus: transaction.paymentStatus },
        { where: { id: transaction.id, [Op.or]: [{ notifiedStatus: null }, { notifiedStatus: { [Op.ne]: transaction.paymentStatus } }] } }
    )
    if (count > 0) await sendTransactionMail(transaction, kind, extra)
}

/** Records an instalment and recalculates the balance; closes the transaction when fully paid */
export async function recordPartPayment(transaction, { paid, datePaid }) {
    const amount = Number(paid)
    if (!(amount > 0)) throw new CustomError(400, "Amount paid must be greater than zero")
    if (!datePaid) throw new CustomError(400, "Date of payment is required")

    const previous = await db.TransactionTimelines.sum("paid", { where: { transactionId: transaction.id } }) || 0
    const total = Number(transaction.charge?.amount ?? transaction.amount) || 0
    const balance = Math.max(0, total - (previous + amount))
    await db.TransactionTimelines.create({ transactionId: transaction.id, paid: amount, datePaid, balance })

    if (balance <= 0) return markTransactionPaid(transaction, { source: "part payments completed" })

    await transaction.update({ paymentStatus: PART_PAID, status: ServerTransactionMainStatus.open })
    await sendTransactionMail(transaction, MailKinds.part_paid, { paid: amount, balance })
    return { changed: true, transaction }
}

/**
 * Admin-driven status change (bank transfers, visa / package enquiries).
 * PAID and Declined go through the same idempotent paths as the gateway.
 */
export async function applyManualPaymentStatus(transaction, { status, paid, datePaid, reason }) {
    switch (status) {
        case PAID: return markTransactionPaid(transaction, { source: "admin" })
        case DECLINED: return markTransactionDeclined(transaction, { reason: reason || "Payment could not be verified", source: "admin" })
        case PART_PAID: return recordPartPayment(transaction, { paid, datePaid })
        case PENDING:
            if (transaction.paymentStatus === PAID) throw new CustomError(400, "A paid transaction cannot be moved back to pending")
            await transaction.update({ paymentStatus: PENDING, status: ServerTransactionMainStatus.open, declineReason: null })
            return { changed: true, transaction }
        default:
            throw new CustomError(400, `Unsupported payment status ${status}`)
    }
}

// Unified Payment statuses (Table 3.0): Approved, Declined, Cancelled, Initiated, EXPIRED
const APPROVED_STATES = ["APPROVED", "SUCCESSFUL", "SUCCESS", "PAID"]
const DECLINED_STATES = ["DECLINED", "FAILED", "REVERSED"]
// Customer left the payment page: nothing was charged, the order is closed as not paid
const ABANDONED_STATES = { CANCELLED: "Payment was cancelled on the payment page", CANCELED: "Payment was cancelled on the payment page", EXPIRED: "The payment session expired before it was completed" }

/** Reads a Unified Payment status record: the status response ({ data: {...} }) or a flat callback body */
export function readUpStatus(payload) {
    const record = payload?.data && typeof payload.data === "object" ? payload.data : payload
    const status = String(record?.Status ?? record?.status ?? "").toUpperCase()
    const description = record?.StatusDescription ?? record?.statusDescription ?? null
    if (APPROVED_STATES.includes(status)) return { state: "paid", status, reason: description }
    // An unpaid order already reports Status "Declined" with StatusDescription "... checkout initiated":
    // the customer can still pay, so it is not a decline
    if (/initiated/i.test(String(description ?? ""))) return { state: "pending", status, reason: description }
    if (DECLINED_STATES.includes(status)) return { state: "declined", status, reason: description && description.toUpperCase() !== status ? description : "Declined by the card issuer or payment provider" }
    if (ABANDONED_STATES[status]) return { state: "declined", status, reason: ABANDONED_STATES[status] }
    // INITIATED or unknown: the customer may still complete the payment
    return { state: "pending", status, reason: description }
}

/**
 * Asks Unified Payment for the real status of a checkout payment and applies it.
 * Used by both the webhook (the webhook is only a trigger) and the customer's verify page.
 */
export async function syncUnifiedPayment(transaction, source) {
    if (transaction.paymentType !== ServerTransactionPaymentType.unified_payment_transfer || !transaction.gatewayToken) {
        return { state: "not_applicable", transaction }
    }
    const payment = await getUpTransaction({ token: transaction.gatewayToken })
    if (payment.status !== 200) throw new CustomError(502, payment.message || "Unable to reach Unified Payment")

    const result = readUpStatus(payment.data)
    // Keep the gateway's exact record (card, approval code, RRN) for receipts and disputes
    await transaction.update({ gatewayResponse: payment.data, gatewayStatus: result.status || null })
    if (result.state === "paid") await markTransactionPaid(transaction, { source })
    if (result.state === "declined") await markTransactionDeclined(transaction, { reason: result.reason || "Declined by the card issuer", source })
    await transaction.reload()
    return { ...result, payment: payment.data, transaction }
}
