import { Op } from "sequelize"
import dayjs from "dayjs"
import db from "../repository/vouchers.repository.js"
import CustomError from "../../../middleware/custom-error.js"
import { MainStatusOptions, roundDecimal, VoucherDiscountTypes, VoucherStatusOptions } from "../../../config/utilities.js"

/**
 * Voucher codes are always validated and priced on the server at checkout.
 * Usage = logs that are pending (tied to an unpaid transaction) or used; declined payments free the slot.
 */

export const normalizeCode = (code) => String(code ?? "").trim().toUpperCase()

async function usageCount(voucherId) {
    return db.VoucherLogs.count({ where: { voucherID: voucherId, status: { [Op.in]: [VoucherStatusOptions.pending, VoucherStatusOptions.used] } } })
}

/**
 * Discount for `amount` in `currency`. FIXED vouchers are an NGN amount; for USD charges they are
 * converted with `ngnPerUsd`. The discount never exceeds the amount and is whole units, like the prices.
 */
export function voucherDiscount(voucher, amount, currency = "NGN", ngnPerUsd = 1) {
    const value = Number(voucher.discountValue) || 0
    const isPercentage = String(voucher.discountType).toUpperCase() === VoucherDiscountTypes.percentage
    let discount = isPercentage ? (amount * value) / 100 : value
    if (!isPercentage && String(currency).toUpperCase() !== "NGN" && ngnPerUsd > 0) discount = value / ngnPerUsd
    discount = Math.min(amount, Math.max(0, discount))
    return Math.floor(roundDecimal(discount, 2))
}

/** Throws a 400/404 CustomError with a customer-friendly message when the code can't be used */
export async function findUsableVoucher(code, service) {
    const voucher = await db.Vouchers.findOne({ where: { code: normalizeCode(code) } })
    if (!voucher) throw new CustomError(404, "This voucher code does not exist")
    if (voucher.status !== MainStatusOptions.true) throw new CustomError(400, "This voucher code is no longer active")
    if (voucher.expirationDate && dayjs(voucher.expirationDate).isBefore(dayjs())) throw new CustomError(400, "This voucher code has expired")
    if (voucher.service && voucher.service !== "ALL" && voucher.service !== service) throw new CustomError(400, "This voucher code cannot be used for this service")
    if (Number(voucher.maxUsageCount) > 0 && (await usageCount(voucher.id)) >= Number(voucher.maxUsageCount)) {
        throw new CustomError(400, "This voucher code has reached its usage limit")
    }
    return voucher
}

/** Price preview for the checkout UI; does not reserve anything */
export async function previewVoucher({ code, service, amount, currency, ngnPerUsd }) {
    const voucher = await findUsableVoucher(code, service)
    const discount = voucherDiscount(voucher, Number(amount) || 0, currency, ngnPerUsd)
    return {
        code: voucher.code,
        discount_type: voucher.discountType,
        discount_value: Number(voucher.discountValue),
        discount,
        payable: roundDecimal((Number(amount) || 0) - discount, 2),
        currency,
    }
}

/** Reserves a usage slot for a transaction being created (call inside the checkout DB transaction) */
export async function reserveVoucher({ voucher, email, amount, discount, transactionId }, options = {}) {
    const isPercentage = String(voucher.discountType).toUpperCase() === VoucherDiscountTypes.percentage
    const log = await db.VoucherLogs.create({
        voucherID: voucher.id,
        email,
        memberId: voucher.accountId,
        status: VoucherStatusOptions.pending,
        date: new Date(),
        expiry: voucher.expirationDate,
        discountValueText: String(voucher.discountValue),
        discountTypeText: voucher.discountType,
        discountType: isPercentage ? `${voucher.discountValue}%` : `NGN ${Number(voucher.discountValue).toLocaleString()}`,
        discountedValue: discount,
        priceCharge: amount,
        transactionId,
    }, options)
    await voucher.update({ currentUsageCount: await usageCount(voucher.id) + 1 }, options)
    return log
}

/** Marks the transaction's voucher used (paid) or releases it (declined) */
export async function settleVoucher(transaction, outcome) {
    if (!transaction?.isVoucher) return
    const log = await db.VoucherLogs.findByPk(transaction.isVoucher)
    if (!log || log.status === VoucherStatusOptions.used) return
    await log.update({ status: outcome === "paid" ? VoucherStatusOptions.used : VoucherStatusOptions.declined })
    const voucher = await db.Vouchers.findByPk(log.voucherID)
    if (voucher) await voucher.update({ currentUsageCount: await usageCount(voucher.id) })
}
