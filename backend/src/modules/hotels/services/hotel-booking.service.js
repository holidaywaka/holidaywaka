import crypto from "crypto"
import dayjs from "dayjs"
import { Op } from "sequelize"
import db from "../repository/hotels.repository.js"
import logger from "../../../middleware/logger.js"
import ratehawkConfig, { RT_TIMEOUTS, RatehawkError, rtConfigs } from "./ratwhawk.config.js"
import { HotelBookingStatus } from "../../../database/models/hotelBookingModel.js"
import { createPayment } from "../../payments/services/createPayment.js"
import { upPaymentPageUrl } from "../../payments/services/upConfig.js"
import {
    generateReference,
    MainStatusOptions,
    safeParse,
    ServerTransactionPaymentType,
    ServerTransactionStatusOptions,
    TransactionTypes,
} from "../../../config/utilities.js"
import { etgStayPayload, HotelServiceError, SEARCH_LANGUAGE } from "./hotel-search.service.js"
import { normalizeRate } from "./rate-normalizer.js"
import { findUsableVoucher, reserveVoucher, voucherDiscount } from "../../vouchers/services/voucher.service.js"
import { MailKinds, sendTransactionMail } from "../../notifications/services/transaction-mail.js"

/**
 * Steps 4 (booking) and 5 (post-booking) of the ETG integration.
 *
 * The guest pays us first (Unified Payment or bank transfer). Only a confirmed payment starts the ETG
 * booking: Create booking process (form) -> Start booking process (finish) -> Check booking process (status),
 * with the receive-booking-status webhook as a second channel. ETG is paid from our deposit ("deposit" type).
 */

// Agreed booking cut-off; ETG treats no final status within it as unsuccessful
const BOOKING_TIMEOUT_MS = Number(process.env.RATEHAWK_BOOKING_TIMEOUT_SECONDS ?? 600) * 1000
const STATUS_POLL_MS = Math.max(1000, Number(process.env.RATEHAWK_STATUS_POLL_MS ?? 3000))
const MAX_FORM_ATTEMPTS = 10
// B2B contracts send one fixed corporate email (and phone) in Start booking process
const BOOKING_EMAIL = process.env.RATEHAWK_BOOKING_EMAIL || process.env.MAIL_USER
const BOOKING_PHONE = process.env.RATEHAWK_BOOKING_PHONE || null
const ORDER_INFO_DELAY_MS = 2 * 60 * 1000
const MAX_EVENTS = 60

// Error groups from the ETG integration requirements
const FORM_RETRYABLE = ["double_booking_form", "duplicate_reservation", "timeout", "unknown"]
const FINISH_CONTINUE = ["timeout", "unknown"]
const STATUS_CONTINUE = ["timeout", "unknown"]
const STATUS_FINAL = [
    "3ds", "block", "book_limit", "booking_finish_did_not_succeed", "charge", "decoding_json", "endpoint_exceeded_limit",
    "endpoint_not_active", "endpoint_not_found", "incorrect_credentials", "invalid_auth_header", "invalid_params", "lock",
    "no_auth_header", "not_allowed", "not_allowed_host", "order_not_found", "overdue_debt", "provider", "soldout", "unexpected_method",
]

const FAILURE_MESSAGES = {
    soldout: "The room sold out at the hotel before it could be confirmed",
    book_limit: "The hotel's booking cut-off was reached",
    provider: "The hotel's supplier rejected the booking",
    not_allowed: "Booking is not allowed for this contract",
    rate_not_found: "The rate is no longer available",
    contract_mismatch: "The rate belongs to a different contract",
    hotel_not_found: "The hotel could not be found by the supplier",
    insufficient_b2b_balance: "Our supplier deposit balance is too low to confirm this booking",
    reservation_is_not_allowed: "Reservations are not enabled for our supplier account",
    sandbox_restriction: "This hotel cannot be booked with sandbox credentials",
    booking_timeout: "The supplier did not confirm the booking within the time limit",
}

const MEAL_LABELS = {
    no_meal: "Room only",
    breakfast: "Breakfast included",
    half_board: "Half board",
    full_board: "Full board",
    all_inclusive: "All inclusive",
    other: "Meals as described",
}

const running = new Set()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isServerError = (error) => error instanceof RatehawkError && (error.status ?? 0) >= 500
const codeOf = (error) => (error instanceof RatehawkError ? error.code : "unknown")
const failureText = (code) => FAILURE_MESSAGES[code] ?? `Supplier error: ${code}`
// Guest names: letters (any script), spaces and '-,.’ only (ETG validation)
const NAME_PATTERN = /^[\p{L}\s'\-,.’]{1,50}$/u

async function addEvent(booking, event, detail = null) {
    const events = [...(booking.events ?? []), { at: new Date().toISOString(), event, detail }].slice(-MAX_EVENTS)
    await booking.update({ events })
}

async function activeNgnPerUsd() {
    const rate = await db.Rates.findOne({ where: { status: MainStatusOptions.true } })
    const quotes = rate ? safeParse(rate.quotes) : []
    return Number((Array.isArray(quotes) ? quotes : []).find((item) => item.quote === "USD")?.value) || 0
}

// ------------------------------------------------------------------ serialisation

export function serializeBooking(booking, { admin = false } = {}) {
    const base = {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        failure_reason: booking.failureReason,
        hid: Number(booking.hid),
        hotel_name: booking.hotelName,
        hotel_address: booking.hotelAddress,
        region_name: booking.regionName,
        checkin: booking.checkin,
        checkout: booking.checkout,
        nights: dayjs(booking.checkout).diff(dayjs(booking.checkin), "day"),
        residency: booking.residency,
        guests: booking.guests,
        rooms: booking.rooms,
        room_name: booking.roomName,
        meal: booking.mealLabel,
        rate: booking.rate,
        free_cancellation_before: booking.freeCancellationBefore,
        contact: { first_name: booking.firstName, last_name: booking.lastName, email: booking.email, phone: booking.phone },
        comment: booking.comment,
        amount: Number(booking.amount),
        discount: Number(booking.discount) || 0,
        currency: booking.currency,
        voucher_code: booking.voucherCode,
        hotel_confirmation_number: booking.hotelConfirmationNumber,
        cancellation: booking.cancellation,
        has_voucher: booking.status === HotelBookingStatus.confirmed,
        confirmed_at: booking.confirmedAt,
        cancelled_at: booking.cancelledAt,
        created_at: booking.createdAt,
    }
    if (!admin) return base
    return {
        ...base,
        etg_status: booking.etgStatus,
        partner_order_id: booking.partnerOrderId,
        partner_order_ids: booking.partnerOrderIds,
        etg_order_id: booking.etgOrderId ? Number(booking.etgOrderId) : null,
        etg_item_id: booking.etgItemId ? Number(booking.etgItemId) : null,
        book_hash: booking.bookHash,
        supplier_confirmation_id: booking.supplierConfirmationId,
        net_amount: Number(booking.netAmount),
        net_currency: booking.netCurrency,
        contract_amount: booking.contractAmount === null ? null : Number(booking.contractAmount),
        contract_currency: booking.contractCurrency,
        exchange_rate: Number(booking.exchangeRate),
        markup: booking.markup,
        etg_payment_type: booking.etgPaymentType,
        order_info: booking.orderInfo,
        events: booking.events,
        transaction_id: booking.transactionId,
        prebook_id: booking.prebookId,
        booking_started_at: booking.bookingStartedAt,
        status_checked_at: booking.statusCheckedAt,
        failed_at: booking.failedAt,
        updated_at: booking.updatedAt,
    }
}

async function loadTransaction(booking) {
    return booking.transactionId ? db.Transactions.findByPk(booking.transactionId) : null
}

function paymentUrl(transaction) {
    if (transaction?.paymentType !== ServerTransactionPaymentType.unified_payment_transfer || !transaction.gatewayToken) return null
    if (transaction.paymentStatus === ServerTransactionStatusOptions.paid) return null
    return upPaymentPageUrl(transaction.gatewayToken)
}

function serializeTransaction(transaction) {
    if (!transaction) return null
    return {
        id: transaction.id,
        txid: transaction.txid,
        tx_type: transaction.txType,
        payment_type: transaction.paymentType,
        payment_status: transaction.paymentStatus,
        decline_reason: transaction.declineReason,
        amount: Number(transaction.charge?.amount ?? transaction.amount),
        currency: transaction.charge?.currency ?? "NGN",
        payment_url: paymentUrl(transaction),
        upload_url: transaction.paymentType === ServerTransactionPaymentType.direct_bank_transfer && !transaction.image
            ? `/upload-payment?transaction_type=${transaction.txType}&transaction_id=${transaction.id}`
            : null,
    }
}

export async function getBooking(id, { admin = false } = {}) {
    const booking = await db.HotelBookings.findByPk(id)
    if (!booking) throw new HotelServiceError(404, "Booking not found", "booking_not_found")
    const transaction = await loadTransaction(booking)
    return { ...serializeBooking(booking, { admin }), transaction: serializeTransaction(transaction) }
}

// ------------------------------------------------------------------ checkout (before payment)

function validateRooms(prebook, rooms) {
    const guests = prebook.guests ?? []
    if (!Array.isArray(rooms) || rooms.length !== guests.length) {
        throw new HotelServiceError(422, `Please enter guest names for all ${guests.length} room(s)`, "incorrect_rooms_number")
    }
    return rooms.map((room, index) => {
        const search = guests[index]
        const adults = (room.adults ?? []).map((guest) => ({ first_name: String(guest.first_name ?? "").trim(), last_name: String(guest.last_name ?? "").trim() }))
        if (adults.length !== Number(search.adults)) {
            throw new HotelServiceError(422, `Room ${index + 1} needs the names of all ${search.adults} adult(s)`, "incorrect_guests_number")
        }
        // Children were searched with their ages; names are optional (ETG: omit them if unknown)
        const children = (room.children ?? [])
            .map((guest, childIndex) => ({ first_name: String(guest?.first_name ?? "").trim(), last_name: String(guest?.last_name ?? "").trim(), age: Number(search.children?.[childIndex]) }))
            .filter((guest) => guest.first_name && guest.last_name)
        for (const guest of [...adults, ...children]) {
            if (!NAME_PATTERN.test(guest.first_name) || !NAME_PATTERN.test(guest.last_name)) {
                throw new HotelServiceError(422, "Guest names may only contain letters, spaces, hyphens and apostrophes", "invalid_guest_name")
            }
        }
        return {
            guests: [
                ...adults.map((guest) => ({ ...guest, is_child: false })),
                ...children.map((guest) => ({ first_name: guest.first_name, last_name: guest.last_name, is_child: true, age: guest.age })),
            ],
        }
    })
}

/**
 * Creates the booking + HOTEL transaction from a valid prebook and starts the chosen payment.
 * Nothing is sent to ETG until the payment is confirmed.
 */
export async function createHotelCheckout({ prebookId, contact, rooms, comment, paymentMethod, voucherCode, userIp }) {
    const prebook = await db.HotelPrebooks.findByPk(prebookId)
    if (!prebook) throw new HotelServiceError(404, "Reservation not found. Please choose your room again.", "prebook_not_found")
    if (dayjs(prebook.expiresAt).isBefore(dayjs())) {
        throw new HotelServiceError(409, "Your price hold has expired. Please refresh the rates and choose your room again.", "prebook_expired")
    }
    const existing = await db.HotelBookings.findOne({ where: { prebookId, status: { [Op.ne]: HotelBookingStatus.payment_declined } } })
    if (existing) {
        throw new HotelServiceError(409, `This room is already being booked (reference ${existing.reference}).`, "booking_exists")
    }

    const rate = prebook.rate ?? {}
    const etgPaymentType = rate.payment?.type
    if (etgPaymentType === "hotel" || etgPaymentType === "now") {
        throw new HotelServiceError(422, "This rate can't be paid online with us. Please choose another rate.", "unsupported_payment_type")
    }
    const bookingRooms = validateRooms(prebook, rooms)

    const [hotel, ngnPerUsd] = await Promise.all([
        db.Hotels.findByPk(prebook.hid, { attributes: ["name", "address"], include: [{ model: db.HotelRegions, attributes: ["name"] }] }),
        activeNgnPerUsd(),
    ])

    const amount = Number(prebook.amount)
    const currency = prebook.currency
    const voucher = voucherCode ? await findUsableVoucher(voucherCode, TransactionTypes.hotel) : null
    const discount = voucher ? voucherDiscount(voucher, amount, currency, ngnPerUsd) : 0
    const payable = Math.max(0, amount - discount)
    const isUnifiedPayment = paymentMethod === ServerTransactionPaymentType.unified_payment_transfer
    const markup = prebook.markup ?? {}

    const t = await db.sequelize.transaction()
    let booking, transaction, payment
    try {
        booking = await db.HotelBookings.create({
            reference: `HW-${generateReference(8)}`,
            prebookId: prebook.id,
            hid: prebook.hid,
            hotelName: prebook.hotelName ?? hotel?.name,
            hotelAddress: hotel?.address ?? null,
            regionName: hotel?.HotelRegion?.name ?? null,
            status: HotelBookingStatus.awaiting_payment,
            bookHash: prebook.bookHash,
            checkin: prebook.checkin,
            checkout: prebook.checkout,
            residency: prebook.residency,
            guests: prebook.guests,
            rooms: bookingRooms,
            roomName: rate.room_name,
            mealLabel: MEAL_LABELS[rate.meal?.category] ?? null,
            rate,
            freeCancellationBefore: rate.payment?.free_cancellation_before ?? null,
            firstName: contact.first_name.trim(),
            lastName: contact.last_name.trim(),
            email: contact.email.trim().toLowerCase(),
            phone: contact.phone.trim(),
            comment: comment?.trim() || null,
            userIp,
            amount: payable,
            discount,
            currency,
            netAmount: prebook.netAmount,
            netCurrency: prebook.netCurrency,
            contractAmount: prebook.contractAmount,
            contractCurrency: prebook.contractCurrency,
            exchangeRate: prebook.exchangeRate,
            markup: prebook.markup,
            etgPaymentType: etgPaymentType ?? "deposit",
            voucherCode: voucher?.code ?? null,
            events: [{ at: new Date().toISOString(), event: "checkout_created", detail: { payment_method: paymentMethod } }],
        }, { transaction: t })

        transaction = await db.Transactions.create({
            txType: TransactionTypes.hotel,
            txid: generateReference(),
            hotelBookingId: booking.id,
            amount: payable,
            discount,
            voucherCode: voucher?.code ?? null,
            paymentType: isUnifiedPayment ? ServerTransactionPaymentType.unified_payment_transfer : ServerTransactionPaymentType.direct_bank_transfer,
            charge: {
                currency,
                amount: payable,
                // NGN per USD, so USD charges can be valued in NGN for reporting
                rate: currency === "NGN" ? Number(prebook.exchangeRate) : ngnPerUsd || 1,
                markup_value: Number(markup.value) || 0,
                vat: Number(markup.vat) || 0,
            },
        }, { transaction: t })

        if (voucher) {
            const log = await reserveVoucher({ voucher, email: booking.email, amount, discount, transactionId: transaction.id }, { transaction: t })
            await transaction.update({ isVoucher: log.id }, { transaction: t })
        }
        await booking.update({ transactionId: transaction.id }, { transaction: t })

        if (isUnifiedPayment) {
            payment = await createPayment({
                amount: payable,
                currency,
                transactionId: transaction.id,
                description: `Hotel booking ${booking.reference} - ${booking.hotelName}`,
                returnRoute: `verify-payment/${transaction.id}/${transaction.txType}`,
            })
            if (payment.status !== 200) throw new HotelServiceError(502, payment.message || "Unable to start the Unified Payment checkout", "payment_init_failed")
            await transaction.update({ orderId: payment.orderId, gatewayToken: payment.token }, { transaction: t })
        }
        await t.commit()
    } catch (error) {
        if (!t.finished) await t.rollback()
        throw error
    }

    await sendTransactionMail(transaction, MailKinds.received, { booking })
    return {
        booking: serializeBooking(booking),
        transaction: serializeTransaction(transaction),
        url: isUnifiedPayment ? payment.url : null,
        attachment: `?transaction_type=${transaction.txType}&transaction_id=${transaction.id}`,
    }
}

// ------------------------------------------------------------------ booking flow (after payment)

export async function markBookingPaymentDeclined(bookingId) {
    await db.HotelBookings.update(
        { status: HotelBookingStatus.payment_declined },
        { where: { id: bookingId, status: HotelBookingStatus.awaiting_payment } }
    )
}

/**
 * Starts (or retries) the ETG booking for a paid booking. Returns immediately; the flow runs in the background.
 * @param {{ from?: string[], partnerOrderSuffix?: string, wait?: boolean }} options
 *   partnerOrderSuffix drives the ETG sandbox scenarios (e.g. "unknown_success"); wait awaits the outcome.
 */
export async function startHotelBooking(bookingId, { from = [HotelBookingStatus.awaiting_payment], partnerOrderSuffix = "", wait = false } = {}) {
    const [count] = await db.HotelBookings.update(
        { status: HotelBookingStatus.booking, bookingStartedAt: new Date(), failureReason: null, etgStatus: null },
        { where: { id: bookingId, status: { [Op.in]: from } } }
    )
    if (count === 0) return null
    const run = runBookingFlow(bookingId, { partnerOrderSuffix })
    if (wait) return run
    run.catch((error) => logger.error(`[hotel-booking] ${bookingId} crashed: ${error.message}`))
    return null
}

async function runBookingFlow(bookingId, { partnerOrderSuffix = "", resumeAtStatus = false } = {}) {
    if (running.has(bookingId)) return null
    running.add(bookingId)
    try {
        const booking = await db.HotelBookings.findByPk(bookingId)
        if (!booking || booking.status !== HotelBookingStatus.booking) return booking
        if (!resumeAtStatus) {
            const started = await createAndFinish(booking, partnerOrderSuffix)
            if (!started) return booking.reload()
        }
        await pollStatus(booking)
        return booking.reload()
    } finally {
        running.delete(bookingId)
    }
}

/** Booking form (with ETG's retry rules) followed by booking finish. Returns false when the flow ended. */
async function createAndFinish(booking, partnerOrderSuffix) {
    let refreshedHash = false
    for (let attempt = 1; attempt <= MAX_FORM_ATTEMPTS; attempt++) {
        const partnerOrderId = `${crypto.randomUUID()}${partnerOrderSuffix ? `-${partnerOrderSuffix}` : ""}`
        await booking.update({ partnerOrderId, partnerOrderIds: [...(booking.partnerOrderIds ?? []), partnerOrderId] })

        // 4.1 Create booking process
        let form
        try {
            const response = await ratehawkConfig.post({
                endpoint: ratehawkConfig.apis.b2b_booking_form,
                data: { partner_order_id: partnerOrderId, book_hash: booking.bookHash, language: SEARCH_LANGUAGE, user_ip: booking.userIp || "127.0.0.1" },
                timeout: RT_TIMEOUTS.booking,
            })
            form = response.data
        } catch (error) {
            const code = codeOf(error)
            await addEvent(booking, "booking_form_error", { attempt, code })
            if (FORM_RETRYABLE.includes(code) || isServerError(error)) continue
            if (code === "rate_not_found" && !refreshedHash) {
                refreshedHash = true
                const refreshed = await refreshBookHash(booking)
                if (refreshed.ok) continue
                await needsAttention(booking, refreshed.reason)
                return false
            }
            await failBooking(booking, code)
            return false
        }

        await booking.update({ etgOrderId: form?.order_id ?? null, etgItemId: form?.item_id ?? null })
        await addEvent(booking, "booking_form_ok", { attempt, order_id: form?.order_id, payment_types: form?.payment_types })

        const paymentType = choosePaymentType(form?.payment_types ?? [], booking.etgPaymentType)
        if (!paymentType) {
            await needsAttention(booking, "The supplier no longer offers a deposit payment option for this rate")
            return false
        }
        const priceIssue = priceIncrease(booking, paymentType)
        if (priceIssue) {
            await needsAttention(booking, priceIssue)
            return false
        }

        // 4.2 Start booking process
        try {
            await ratehawkConfig.post({
                endpoint: ratehawkConfig.apis.b2b_booking_finish,
                data: finishPayload(booking, partnerOrderId, paymentType, form),
                timeout: RT_TIMEOUTS.booking,
            })
            await addEvent(booking, "booking_finish_ok", { partner_order_id: partnerOrderId })
            return true
        } catch (error) {
            const code = codeOf(error)
            await addEvent(booking, "booking_finish_error", { code })
            // The booking may still exist: go and check its status
            if (FINISH_CONTINUE.includes(code) || isServerError(error)) return true
            if (code === "booking_form_expired") continue
            if (code === "rate_not_found" && !refreshedHash) {
                refreshedHash = true
                const refreshed = await refreshBookHash(booking)
                if (refreshed.ok) continue
                await needsAttention(booking, refreshed.reason)
                return false
            }
            await failBooking(booking, code)
            return false
        }
    }
    await failBooking(booking, "unknown", "The supplier did not accept the booking after 10 attempts")
    return false
}

function choosePaymentType(paymentTypes, preferred) {
    return paymentTypes.find((item) => item.type === preferred && item.type !== "now")
        ?? paymentTypes.find((item) => item.type === "deposit")
        ?? null
}

/** The guest paid for the prebooked contract amount; never book at a higher supplier price */
function priceIncrease(booking, paymentType) {
    const paid = Number(booking.contractAmount)
    const quoted = Number(paymentType.amount)
    if (!(paid > 0) || !Number.isFinite(quoted)) return null
    if (booking.contractCurrency && paymentType.currency_code && booking.contractCurrency !== paymentType.currency_code) return null
    if (quoted > paid + 0.009) {
        return `Supplier price increased from ${paid.toFixed(2)} to ${quoted.toFixed(2)} ${paymentType.currency_code ?? ""} since payment`.trim()
    }
    return null
}

function finishPayload(booking, partnerOrderId, paymentType, form) {
    const contactPhone = BOOKING_PHONE || booking.phone
    return {
        user: { email: BOOKING_EMAIL, phone: contactPhone, ...(booking.comment ? { comment: booking.comment.slice(0, 256) } : {}) },
        supplier_data: {
            first_name_original: booking.firstName,
            last_name_original: booking.lastName,
            phone: booking.phone,
            email: booking.email,
        },
        partner: { partner_order_id: partnerOrderId, comment: booking.reference },
        language: SEARCH_LANGUAGE,
        rooms: (booking.rooms ?? []).map((room) => ({
            guests: room.guests.map((guest) => ({
                first_name: guest.first_name,
                last_name: guest.last_name,
                ...(guest.is_child ? { is_child: true, age: guest.age } : {}),
                ...(form?.is_gender_specification_required && guest.gender ? { gender: guest.gender } : {}),
            })),
        })),
        payment_type: { type: paymentType.type, amount: paymentType.amount, currency_code: paymentType.currency_code },
    }
}

/** 4.3 Check booking process: poll until a final status or the booking cut-off */
async function pollStatus(booking) {
    const deadline = new Date(booking.bookingStartedAt ?? Date.now()).getTime() + BOOKING_TIMEOUT_MS
    let lastCheck = false
    for (;;) {
        await booking.reload()
        // The webhook (or an admin) may already have settled it
        if (booking.status !== HotelBookingStatus.booking) return

        let result
        try {
            const response = await ratehawkConfig.post({
                endpoint: ratehawkConfig.apis.b2b_booking_finish_status,
                data: { partner_order_id: booking.partnerOrderId },
                timeout: RT_TIMEOUTS.default,
            })
            result = { status: response.status, error: response.error ?? null }
        } catch (error) {
            result = { status: "error", error: codeOf(error), transient: isServerError(error) }
        }
        await booking.update({ etgStatus: result.error ?? result.status, statusCheckedAt: new Date() })

        if (result.status === "ok") return confirmBooking(booking, "status")
        if (result.error && STATUS_FINAL.includes(result.error)) return failBooking(booking, result.error)
        const keepPolling = result.status === "processing" || result.transient || STATUS_CONTINUE.includes(result.error)
        if (!keepPolling) return failBooking(booking, result.error ?? "unknown")

        if (lastCheck) return failBooking(booking, "booking_timeout")
        const remaining = deadline - Date.now()
        // Always send one last status request right before the cut-off
        if (remaining <= STATUS_POLL_MS) {
            lastCheck = true
            await sleep(Math.max(0, remaining - 500))
        } else {
            await sleep(STATUS_POLL_MS)
        }
    }
}

/**
 * Prebook again from a fresh hotelpage when the paid hash expired (e.g. a slow bank transfer).
 * The same rate is found by match_hash; it is only accepted at or below the price the guest paid.
 */
async function refreshBookHash(booking) {
    try {
        const params = {
            checkin: dayjs(booking.checkin).format("YYYY-MM-DD"),
            checkout: dayjs(booking.checkout).format("YYYY-MM-DD"),
            residency: booking.residency,
            currency: "USD",
            guests: booking.guests,
        }
        const hotelPage = await ratehawkConfig.post({
            endpoint: ratehawkConfig.apis.b2b_search_hotel_page,
            data: { ...etgStayPayload(params), hid: Number(booking.hid) },
            timeout: RT_TIMEOUTS.search,
        })
        const rates = (hotelPage.data?.hotels?.[0]?.rates ?? []).map(normalizeRate)
        const original = booking.rate ?? {}
        const match = rates.find((rate) => original.match_hash && rate.match_hash === original.match_hash)
            ?? rates.find((rate) => rate.room_name === original.room_name && rate.meal?.value === original.meal?.value && rate.payment?.type === original.payment?.type)
        if (!match?.book_hash) return { ok: false, reason: "The room is no longer available at the hotel" }

        const prebook = await ratehawkConfig.post({
            endpoint: ratehawkConfig.apis.b2b_hotel_prebook,
            data: { hash: match.book_hash, price_increase_percent: 0 },
            timeout: RT_TIMEOUTS.prebook,
        })
        const fresh = normalizeRate(prebook.data?.hotels?.[0]?.rates?.[0])
        const payment = fresh.payment_types.find((item) => item.type === booking.etgPaymentType) ?? fresh.payment
        if (!fresh.book_hash || !payment) return { ok: false, reason: "The room is no longer available at the hotel" }
        if (booking.contractAmount && payment.amount > Number(booking.contractAmount) + 0.009) {
            return { ok: false, reason: `The supplier price rose from ${Number(booking.contractAmount).toFixed(2)} to ${payment.amount.toFixed(2)} ${payment.currency ?? ""}`.trim() }
        }
        await booking.update({ bookHash: fresh.book_hash })
        await addEvent(booking, "book_hash_refreshed", { book_hash: fresh.book_hash, amount: payment.amount, currency: payment.currency })
        return { ok: true }
    } catch (error) {
        await addEvent(booking, "book_hash_refresh_failed", { code: codeOf(error) })
        return { ok: false, reason: `The rate could not be refreshed (${codeOf(error)})` }
    }
}

// ------------------------------------------------------------------ final states

async function confirmBooking(booking, source) {
    const [count] = await db.HotelBookings.update(
        { status: HotelBookingStatus.confirmed, confirmedAt: new Date(), failureReason: null, etgStatus: "ok" },
        // A webhook can still confirm a booking we had timed out
        { where: { id: booking.id, [Op.or]: [{ status: HotelBookingStatus.booking }, { status: HotelBookingStatus.failed, etgStatus: "booking_timeout" }] } }
    )
    await booking.reload()
    if (count === 0) return booking
    await addEvent(booking, "confirmed", { source })
    logger.info(`[hotel-booking] ${booking.reference} confirmed via ${source}`)
    await sendTransactionMail(await loadTransaction(booking), MailKinds.hotel_confirmed, { booking })
    // The hotel confirmation number arrives asynchronously
    setTimeout(() => refreshOrderInfo(booking.id).catch((error) => logger.warn(`[hotel-booking] order info for ${booking.reference}: ${error.message}`)), ORDER_INFO_DELAY_MS).unref?.()
    return booking
}

async function failBooking(booking, code, message) {
    const [count] = await db.HotelBookings.update(
        { status: HotelBookingStatus.failed, failedAt: new Date(), etgStatus: code, failureReason: message ?? failureText(code) },
        { where: { id: booking.id, status: HotelBookingStatus.booking } }
    )
    await booking.reload()
    if (count === 0) return booking
    await addEvent(booking, "failed", { code })
    logger.warn(`[hotel-booking] ${booking.reference} failed: ${code}`)
    await sendTransactionMail(await loadTransaction(booking), MailKinds.hotel_failed, { booking, reason: booking.failureReason })
    return booking
}

async function needsAttention(booking, reason) {
    const [count] = await db.HotelBookings.update(
        { status: HotelBookingStatus.needs_attention, failureReason: reason },
        { where: { id: booking.id, status: HotelBookingStatus.booking } }
    )
    await booking.reload()
    if (count === 0) return booking
    await addEvent(booking, "needs_attention", { reason })
    await sendTransactionMail(await loadTransaction(booking), MailKinds.hotel_attention, { booking, reason })
    return booking
}

// ------------------------------------------------------------------ 4.4 booking status webhook

export function verifyEtgWebhook(signature) {
    if (!signature?.signature || !signature?.timestamp || !signature?.token || !rtConfigs.apiAccessToken) return false
    const expected = crypto.createHmac("sha256", rtConfigs.apiAccessToken).update(`${signature.timestamp}${signature.token}`).digest("hex")
    const a = Buffer.from(expected, "hex")
    const b = Buffer.from(String(signature.signature), "hex")
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Applies an ETG booking-status webhook. Returns a short description of what happened. */
export async function handleEtgWebhook(body) {
    if (!verifyEtgWebhook(body?.signature)) throw new HotelServiceError(401, "Invalid webhook signature", "invalid_signature")
    const partnerOrderId = body?.data?.partner_order_id
    const status = body?.data?.status
    const booking = partnerOrderId ? await db.HotelBookings.findOne({ where: { partnerOrderId } }) : null
    if (!booking) {
        logger.warn(`[hotel-booking] webhook for unknown partner_order_id ${partnerOrderId}`)
        return "ignored: unknown order"
    }
    await addEvent(booking, "webhook", { status })
    if (status === "completed") {
        await confirmBooking(booking, "webhook")
        return "confirmed"
    }
    if (status === "failed") {
        // The webhook carries no reason; Check booking process has it
        let code = "provider"
        try {
            const response = await ratehawkConfig.post({ endpoint: ratehawkConfig.apis.b2b_booking_finish_status, data: { partner_order_id: partnerOrderId } })
            code = response.error ?? code
        } catch (error) {
            code = codeOf(error)
        }
        await failBooking(booking, code)
        return "failed"
    }
    return "ignored: unknown status"
}

// ------------------------------------------------------------------ 5. post-booking

/** 5.2 Cancel booking (confirmed orders only). Retries once on timeout, as ETG recommends. */
export async function cancelHotelBooking(bookingId, { reason } = {}) {
    const booking = await db.HotelBookings.findByPk(bookingId)
    if (!booking) throw new HotelServiceError(404, "Booking not found", "booking_not_found")
    if (booking.status !== HotelBookingStatus.confirmed) {
        throw new HotelServiceError(409, "Only confirmed bookings can be cancelled with the hotel", "not_cancellable")
    }

    let response
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            response = await ratehawkConfig.post({ endpoint: ratehawkConfig.apis.b2b_order_cancel, data: { partner_order_id: booking.partnerOrderId }, timeout: RT_TIMEOUTS.booking })
            break
        } catch (error) {
            const code = codeOf(error)
            await addEvent(booking, "cancel_error", { attempt, code })
            if (code === "timeout" && attempt === 1) continue
            const messages = {
                order_not_cancellable: "The hotel no longer allows cancelling this booking (the stay has started or the rate is non-refundable).",
                order_not_found: "The supplier could not find this order.",
                lock: "A cancellation is already in progress. Please try again in a minute.",
            }
            throw new HotelServiceError(409, messages[code] ?? `The supplier could not cancel the booking (${code})`, code)
        }
    }

    const data = response?.data ?? {}
    const money = (item) => (item ? { amount: Number(item.amount), currency: item.currency_code } : null)
    const penalty = money(data.amount_payable)
    const refund = money(data.amount_refunded)
    await booking.update({
        status: HotelBookingStatus.cancelled,
        cancelledAt: new Date(),
        cancellation: {
            reason: reason ?? null,
            // Supplier (net) amounts from ETG, in the contract currency
            penalty: penalty?.amount ?? 0,
            refund: refund?.amount ?? 0,
            currency: penalty?.currency ?? refund?.currency ?? booking.contractCurrency,
            amount_sell: money(data.amount_sell),
        },
    })
    await addEvent(booking, "cancelled", { penalty, refund, reason })
    await sendTransactionMail(await loadTransaction(booking), MailKinds.hotel_cancelled, { booking })
    return serializeBooking(booking, { admin: true })
}

/** 5.1 Retrieve bookings: hotel confirmation number and ETG-side status, never used to confirm a booking */
export async function refreshOrderInfo(bookingId) {
    const booking = await db.HotelBookings.findByPk(bookingId)
    if (!booking?.partnerOrderId) throw new HotelServiceError(404, "Booking has no supplier order yet", "order_not_found")
    const response = await ratehawkConfig.post({
        endpoint: ratehawkConfig.apis.b2b_order_info,
        data: {
            ordering: { ordering_type: "desc", ordering_by: "created_at" },
            pagination: { page_size: 1, page_number: 1 },
            search: { partner_order_ids: [booking.partnerOrderId] },
            language: SEARCH_LANGUAGE,
        },
    })
    const order = response.data?.orders?.[0]
    if (!order) throw new HotelServiceError(404, "The supplier has not synced this order yet. Try again in a few minutes.", "order_not_synced")
    await booking.update({
        orderInfo: {
            status: order.status,
            order_id: order.order_id,
            created_at: order.created_at,
            cancelled_at: order.cancelled_at,
            amount_payable: order.amount_payable,
            amount_refunded: order.amount_refunded,
            amount_sell: order.amount_sell,
            free_cancellation_before: order.cancellation_info?.free_cancellation_before ?? null,
            cancellation_policies: order.cancellation_info?.policies ?? [],
            payment_data: order.payment_data,
            rooms_data: order.rooms_data,
            synced_at: new Date().toISOString(),
        },
        hotelConfirmationNumber: order.hotel_data?.order_id ?? booking.hotelConfirmationNumber,
        supplierConfirmationId: order.supplier_data?.confirmation_id ?? booking.supplierConfirmationId,
        etgOrderId: order.order_id ?? booking.etgOrderId,
        ...(order.status === "cancelled" && booking.status === HotelBookingStatus.confirmed
            ? { status: HotelBookingStatus.cancelled, cancelledAt: order.cancelled_at ?? new Date() }
            : {}),
    })
    return serializeBooking(booking, { admin: true })
}

/** ETG voucher PDF for a confirmed booking */
export async function downloadVoucher(bookingId) {
    const booking = await db.HotelBookings.findByPk(bookingId)
    if (!booking) throw new HotelServiceError(404, "Booking not found", "booking_not_found")
    if (booking.status !== HotelBookingStatus.confirmed) throw new HotelServiceError(409, "The voucher is available once the booking is confirmed", "not_confirmed")
    try {
        const result = await ratehawkConfig.download({
            endpoint: ratehawkConfig.apis.b2b_voucher_download,
            params: { data: JSON.stringify({ partner_order_id: booking.partnerOrderId, language: SEARCH_LANGUAGE }) },
        })
        return { ...result, filename: `voucher-${booking.reference}.pdf` }
    } catch (error) {
        const code = codeOf(error)
        if (["pending", "failed_to_generate_document", "voucher_is_not_downloadable"].includes(code)) {
            throw new HotelServiceError(409, "Your voucher is still being prepared. Please try again in a few minutes.", code)
        }
        throw error
    }
}

/** Admin: retry a booking that needs attention or failed after payment */
export async function retryHotelBooking(bookingId) {
    const booking = await db.HotelBookings.findByPk(bookingId)
    if (!booking) throw new HotelServiceError(404, "Booking not found", "booking_not_found")
    const transaction = await loadTransaction(booking)
    if (transaction?.paymentStatus !== ServerTransactionStatusOptions.paid) {
        throw new HotelServiceError(409, "The booking can only be retried once the payment is confirmed", "not_paid")
    }
    const outcome = await startHotelBooking(bookingId, { from: [HotelBookingStatus.needs_attention, HotelBookingStatus.failed], wait: true })
    if (!outcome) throw new HotelServiceError(409, `A booking in status ${booking.status} cannot be retried`, "not_retryable")
    return serializeBooking(outcome, { admin: true })
}

// ------------------------------------------------------------------ recovery

/**
 * Resumes polling for bookings whose flow stopped (restart, crash); ETG keeps processing them meanwhile.
 * Only bookings not checked for a minute are picked up, so live flows are left alone.
 */
export async function resumeInterruptedBookings() {
    const staleBefore = new Date(Date.now() - 60_000)
    const stuck = await db.HotelBookings.findAll({
        where: {
            status: HotelBookingStatus.booking,
            [Op.or]: [{ statusCheckedAt: null, bookingStartedAt: { [Op.lt]: staleBefore } }, { statusCheckedAt: { [Op.lt]: staleBefore } }],
        },
        attributes: ["id", "partnerOrderId", "etgOrderId"],
    })
    for (const booking of stuck) {
        if (running.has(booking.id)) continue
        runBookingFlow(booking.id, { resumeAtStatus: Boolean(booking.etgOrderId) })
            .catch((error) => logger.error(`[hotel-booking] resume ${booking.id} failed: ${error.message}`))
    }
    return stuck.length
}

// ------------------------------------------------------------------ admin listing

export async function listBookings({ status, search, page = 1, pageSize = 20 }) {
    const where = {}
    if (status) where.status = status
    if (search?.trim()) {
        const term = `%${search.trim()}%`
        where[Op.or] = [
            { reference: { [Op.like]: term } },
            { hotelName: { [Op.like]: term } },
            { email: { [Op.like]: term } },
            { lastName: { [Op.like]: term } },
            { firstName: { [Op.like]: term } },
            { partnerOrderId: { [Op.like]: term } },
        ]
    }
    const { rows, count } = await db.HotelBookings.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    })
    const transactions = await db.Transactions.findAll({
        where: { id: rows.map((row) => row.transactionId).filter(Boolean) },
        attributes: ["id", "paymentStatus", "paymentType", "txid", "image"],
    })
    const byId = new Map(transactions.map((item) => [item.id, item]))
    const counts = await db.HotelBookings.findAll({
        attributes: ["status", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]],
        group: ["status"],
        raw: true,
    })
    return {
        page,
        page_size: pageSize,
        total: count,
        total_pages: Math.max(1, Math.ceil(count / pageSize)),
        status_counts: Object.fromEntries(counts.map((row) => [row.status, Number(row.count)])),
        data: rows.map((row) => {
            const transaction = byId.get(row.transactionId)
            return {
                ...serializeBooking(row, { admin: true }),
                events: undefined,
                payment: transaction ? { status: transaction.paymentStatus, type: transaction.paymentType, txid: transaction.txid, has_proof: Boolean(transaction.image) } : null,
            }
        }),
    }
}
