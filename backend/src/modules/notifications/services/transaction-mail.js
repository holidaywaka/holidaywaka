import dayjs from "dayjs"
import db from "../repository/notifications.repository.js"
import logger from "../../../middleware/logger.js"
import { JOB_FILES, runJobs } from "../../../config/jobs-utils.js"
import { MainStatusOptions, ServerTransactionPaymentType, TransactionTypes, USER_TYPES } from "../../../config/utilities.js"

/**
 * Detailed customer + admin emails for every paid service (packages, visa, transfers, hotels).
 * One builder per service turns the linked records into sections; the kind decides the framing.
 */

export const MailKinds = {
    received: "received",
    paid: "paid",
    part_paid: "part_paid",
    declined: "declined",
    hotel_confirmed: "hotel_confirmed",
    hotel_failed: "hotel_failed",
    hotel_attention: "hotel_attention",
    hotel_cancelled: "hotel_cancelled",
}

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://holidaywaka.com").replace(/\/$/, "")

const BANNERS = {
    info: { background: "#fff6e5", color: "#7a4a00" },
    success: { background: "#e6f6ee", color: "#0d5c36" },
    danger: { background: "#fdecec", color: "#8a1c1c" },
    neutral: { background: "#eef2f6", color: "#243b53" },
}

const SERVICE_NAMES = {
    [TransactionTypes.trip]: "holiday package",
    [TransactionTypes.visa]: "visa application",
    [TransactionTypes.transfer]: "airport transfer",
    [TransactionTypes.chauffeur]: "chauffeur service",
    [TransactionTypes.hotel]: "hotel booking",
}

export function formatMoney(amount, currency = "NGN") {
    const value = Number(amount)
    if (!Number.isFinite(value)) return "-"
    const code = String(currency || "NGN").toUpperCase()
    return `${code} ${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const formatDate = (value, format = "ddd, D MMM YYYY") => (value ? dayjs(value).format(format) : "-")
const paymentMethodLabel = (type) => type === ServerTransactionPaymentType.unified_payment_transfer ? "Unified Payment checkout" : "Direct bank transfer"
const compactRows = (rows) => rows.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "" && row.value !== "-")
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`

/** Customer-facing amounts: what was charged, plus discount when a voucher was used */
function chargeTotals(transaction) {
    const charge = transaction.charge && !Array.isArray(transaction.charge) ? transaction.charge : {}
    const currency = charge.currency || "NGN"
    const total = Number(charge.amount ?? transaction.amount) || 0
    const discount = Number(transaction.discount) || 0
    return {
        currency,
        total,
        rows: discount > 0
            ? [
                { label: "Subtotal", value: formatMoney(total + discount, currency) },
                { label: `Voucher${transaction.voucherCode ? ` (${transaction.voucherCode})` : ""}`, value: `- ${formatMoney(discount, currency)}` },
            ]
            : [],
    }
}

// ------------------------------------------------------------------ per-service details

async function tripDetails(transaction) {
    const enquiry = transaction.tripId ? await db.TripEnquiries.findByPk(transaction.tripId, { include: [{ model: db.Trips }] }) : null
    const trip = enquiry?.Trip
    const travelers = enquiry?.travelers ?? []
    const lead = travelers[0] ?? {}
    const currency = transaction.charge?.currency || "NGN"
    const destinations = (trip?.destinations ?? []).map((item) => [item.city, item.country].filter(Boolean).join(", ")).join(" · ")
    return {
        customer: { name: [lead.firstName, lead.lastName].filter(Boolean).join(" "), email: lead.email, phone: `${lead.phoneCode ?? ""}${lead.phone ?? ""}` },
        title: trip?.title?.trim() || "Holiday package",
        sections: [
            {
                title: "Package",
                rows: compactRows([
                    { label: "Package", value: trip?.title?.trim() },
                    { label: "Trip type", value: enquiry?.tripType },
                    { label: "Destination", value: destinations },
                    { label: "Travel date", value: formatDate(enquiry?.travelDate) },
                    trip?.visaRequired ? { label: "Visa", value: `Required · about ${plural(trip.visaProcessingDays || 0, "working day")} to process` } : null,
                    { label: "Special request", value: enquiry?.message },
                ]),
            },
            {
                title: `Travellers (${travelers.length})`,
                rows: travelers.map((traveler) => ({
                    label: `${traveler.tag ?? "Traveller"}${traveler.priceType ? ` · ${traveler.priceType}` : ""}`,
                    value: `${[traveler.firstName, traveler.lastName].filter(Boolean).join(" ")} — ${formatMoney(traveler.baseAmount ?? traveler.priceAmount, currency)}`,
                })),
            },
        ],
    }
}

async function visaDetails(transaction, enquiryOverride) {
    const enquiry = enquiryOverride ?? (transaction.visaId ? await db.VisaEnquiries.findByPk(transaction.visaId) : null)
    const visa = enquiry?.visa ?? {}
    const paymentFor = { appointment: "Appointment booking", fullPayment: "Full payment", enquiry: "Enquiry" }[visa.paymentType] ?? visa.paymentType
    return {
        customer: { name: [enquiry?.firstName, enquiry?.lastName].filter(Boolean).join(" "), email: enquiry?.email, phone: enquiry?.phone },
        title: `${visa.country ?? "Visa"} ${visa.visaType ?? ""}`.trim(),
        sections: [{
            title: "Visa application",
            rows: compactRows([
                { label: "Destination", value: visa.country },
                { label: "Visa type", value: visa.visaType },
                { label: "Payment for", value: paymentFor },
                { label: "Nationality", value: enquiry?.nationality },
                { label: "Planned travel date", value: formatDate(enquiry?.travelDate) },
                { label: "Passport", value: enquiry?.hasPassport === "yes" ? `Yes${enquiry?.passportNumber ? ` (${enquiry.passportNumber})` : ""}` : "Not yet" },
                { label: "Message", value: enquiry?.message },
            ]),
        }],
    }
}

async function transferDetails(transaction) {
    const transfer = transaction.transferId ? await db.Transfers.findByPk(transaction.transferId) : null
    const trip = (transfer?.trips ?? [])[0] ?? {}
    const lead = (trip.passengers ?? [])[0] ?? {}
    const place = (point) => point ? [point.title, point.address, point.city].filter(Boolean).join(", ") : null
    const isChauffeur = transfer?.pickup_type === TransactionTypes.chauffeur
    return {
        customer: { name: lead.name, email: lead.email, phone: lead.phone },
        title: isChauffeur ? "Chauffeur service" : "Airport transfer",
        sections: [{
            title: isChauffeur ? "Chauffeur" : "Transfer",
            rows: compactRows([
                { label: "Pickup", value: place(trip.origin) },
                isChauffeur ? null : { label: "Drop-off", value: place(trip.destination) },
                { label: "Pickup time", value: formatDate(trip.date_arrival ?? trip.date, "ddd, D MMM YYYY, HH:mm") },
                isChauffeur && trip.duration ? { label: "Duration", value: plural(Math.round(trip.duration / 60) || trip.duration, "hour") } : null,
                { label: "Vehicle", value: [trip.car_models, trip.car_title ? `${trip.car_title} class` : null].filter(Boolean).join(", ") },
                { label: "Passengers", value: trip.passengers?.length ? String(trip.passengers.length) : null },
                { label: "Booking code", value: trip.bookingCode },
                { label: "Free cancellation until", value: trip.cancellation_time_without_penalty ? formatDate(trip.cancellation_time_without_penalty, "ddd, D MMM YYYY, HH:mm") : null },
            ]),
        }],
    }
}

async function hotelDetails(transaction, bookingOverride) {
    const booking = bookingOverride ?? (transaction?.hotelBookingId ? await db.HotelBookings.findByPk(transaction.hotelBookingId) : null)
    if (!booking) return { customer: {}, title: "Hotel booking", sections: [] }
    const nights = dayjs(booking.checkout).diff(dayjs(booking.checkin), "day")
    const guests = booking.guests ?? []
    const totalGuests = guests.reduce((sum, room) => sum + Number(room.adults || 0) + (room.children?.length ?? 0), 0)
    const payment = booking.rate?.payment ?? {}
    const hotelTaxes = (payment.taxes ?? []).filter((tax) => !tax.included_by_supplier)
    const guestNames = (booking.rooms ?? []).map((room, index) => ({
        label: `Room ${index + 1}`,
        value: (room.guests ?? []).map((guest) => `${guest.first_name} ${guest.last_name}${guest.is_child ? ` (child, ${guest.age})` : ""}`).join(", "),
    }))
    return {
        customer: { name: [booking.firstName, booking.lastName].filter(Boolean).join(" "), email: booking.email, phone: booking.phone },
        title: booking.hotelName ?? "Hotel booking",
        booking,
        sections: [
            {
                title: "Stay",
                rows: compactRows([
                    { label: "Hotel", value: booking.hotelName },
                    { label: "Address", value: [booking.hotelAddress, booking.regionName].filter(Boolean).join(", ") },
                    { label: "Check-in", value: formatDate(booking.checkin) },
                    { label: "Check-out", value: formatDate(booking.checkout) },
                    { label: "Length of stay", value: plural(nights, "night") },
                    { label: "Rooms and guests", value: `${plural(guests.length, "room")}, ${plural(totalGuests, "guest")}` },
                    { label: "Room", value: booking.roomName },
                    { label: "Meals", value: booking.mealLabel },
                    { label: "Cancellation", value: booking.freeCancellationBefore ? `Free until ${formatDate(booking.freeCancellationBefore, "D MMM YYYY, HH:mm")} (UTC)` : "Non-refundable" },
                    { label: "Hotel confirmation no.", value: booking.hotelConfirmationNumber },
                    { label: "Booking reference", value: booking.reference },
                ]),
            },
            { title: "Guests", rows: guestNames },
            hotelTaxes.length ? {
                title: "Payable at the hotel",
                rows: hotelTaxes.map((tax) => ({ label: tax.name?.replace(/_/g, " "), value: formatMoney(tax.amount, tax.currency) })),
            } : null,
        ].filter(Boolean),
    }
}

async function serviceDetails(transaction, extra) {
    switch (transaction?.txType) {
        case TransactionTypes.trip: return tripDetails(transaction)
        case TransactionTypes.visa: return visaDetails(transaction, extra.visaEnquiry)
        case TransactionTypes.transfer:
        case TransactionTypes.chauffeur: return transferDetails(transaction)
        case TransactionTypes.hotel: return hotelDetails(transaction, extra.booking)
        default: return { customer: {}, title: "Order", sections: [] }
    }
}

// ------------------------------------------------------------------ kinds

function paymentSection(transaction, extraRows = []) {
    return {
        title: "Payment",
        rows: compactRows([
            { label: "Invoice number", value: transaction.id },
            { label: "Payment reference", value: transaction.txid },
            { label: "Method", value: paymentMethodLabel(transaction.paymentType) },
            { label: "Status", value: transaction.paymentStatus },
            ...extraRows,
            { label: "Date", value: formatDate(transaction.createdAt, "D MMM YYYY, HH:mm") },
        ]),
    }
}

/** Details from Unified Payment's status record (their go-live guide asks for them on the receipt) */
export function gatewayRows(transaction) {
    const record = transaction?.gatewayResponse
    if (!record || Array.isArray(record) || typeof record !== "object") return []
    const data = record.data && typeof record.data === "object" ? record.data : record
    return compactRows([
        { label: "Gateway order id", value: data["Order Id"] ?? data.transaction_id },
        { label: "Card", value: [data.Scheme, data.PAN].filter(Boolean).join(" ") || null },
        { label: "Approval code", value: data["Approval Code"] },
        { label: "Bank reference (RRN)", value: data.RRN },
        { label: "Gateway status", value: data.StatusDescription ?? data.Status ?? data.transaction_status },
        { label: "Processed at", value: data.TranDateTime ?? record.created_at },
    ])
}

async function bankAccountRows() {
    const bank = await db.Banks.findOne({ where: { status: MainStatusOptions.true } })
    if (!bank) return []
    const data = bank.toJSON()
    return compactRows([
        { label: "Bank", value: data.bankName ?? data.bank_name ?? data.name },
        { label: "Account name", value: data.accountName ?? data.account_name },
        { label: "Account number", value: data.accountNumber ?? data.account_number ?? data.number },
    ])
}

function verifyLink(transaction) {
    return `${FRONTEND_URL}/verify-payment/${transaction.id}/${transaction.txType}`
}

function uploadLink(transaction) {
    return `${FRONTEND_URL}/upload-payment?transaction_type=${transaction.txType}&transaction_id=${transaction.id}`
}

/**
 * Builds { subject, title, banner, paragraphs, sections, totals, steps, action } for one kind.
 * `extra` may carry: reason (declined/failed), paid & balance (part payment), booking, visaEnquiry, cancellation.
 */
async function composeMail(transaction, kind, extra = {}) {
    const details = await serviceDetails(transaction, extra)
    const serviceName = SERVICE_NAMES[transaction?.txType] ?? "order"
    const money = transaction ? chargeTotals(transaction) : { currency: "NGN", total: 0, rows: [] }
    const totals = transaction ? { rows: money.rows, label: "Total", value: formatMoney(money.total, money.currency) } : null
    const isBank = transaction?.paymentType !== ServerTransactionPaymentType.unified_payment_transfer
    const reference = extra.booking?.reference ?? transaction?.txid
    const base = { serviceName, reference, details, totals }

    switch (kind) {
        case MailKinds.received: {
            const bankRows = isBank ? await bankAccountRows() : []
            return {
                ...base,
                subject: `We've received your ${serviceName} request – ${reference}`,
                banner: { ...BANNERS.info, label: "Awaiting payment" },
                title: details.title,
                paragraphs: [
                    `Thank you for choosing us. Your ${serviceName} is saved and will be confirmed as soon as your payment is received.`,
                    isBank ? "Please transfer the total below to our account and upload your payment slip using the button below." : "Complete your payment on the secure Unified Payment checkout page (card, transfer, USSD or QR). If you closed it, use the button below to check your payment status.",
                ],
                sections: [...details.sections, paymentSection(transaction), ...(bankRows.length ? [{ title: "Pay into", rows: bankRows }] : [])],
                steps: isBank
                    ? ["Transfer the exact total to the account above, using the payment reference as narration.", "Upload your payment slip so our team can confirm it.", "You will receive a confirmation email once the payment is verified."]
                    : ["Finish your payment on the Unified Payment checkout page.", "You will receive a receipt by email once the payment is approved."],
                action: isBank ? { label: "Upload payment slip", url: uploadLink(transaction) } : { label: "Check payment status", url: verifyLink(transaction) },
            }
        }
        case MailKinds.paid:
            return {
                ...base,
                subject: `Payment confirmed – ${details.title} (${reference})`,
                banner: { ...BANNERS.success, label: "Payment confirmed" },
                title: details.title,
                paragraphs: [
                    transaction.txType === TransactionTypes.hotel
                        ? "We have received your payment and are now confirming your room with the hotel. You'll receive your booking confirmation in a separate email, usually within a few minutes."
                        : `We have received your payment for your ${serviceName}. This email is your receipt.`,
                ],
                sections: [
                    ...details.sections,
                    paymentSection(transaction, [{ label: "Paid on", value: formatDate(new Date(), "D MMM YYYY, HH:mm") }]),
                    ...(gatewayRows(transaction).length ? [{ title: "Unified Payment record", rows: gatewayRows(transaction) }] : []),
                ],
                steps: transaction.txType === TransactionTypes.hotel ? ["We confirm your room with the hotel.", "You receive the booking confirmation and voucher by email."] : ["Our team will contact you with the next steps for your " + serviceName + "."],
                action: { label: "View payment", url: verifyLink(transaction) },
            }
        case MailKinds.part_paid:
            return {
                ...base,
                subject: `Part payment received – ${details.title} (${reference})`,
                banner: { ...BANNERS.info, label: "Part payment received" },
                title: details.title,
                paragraphs: [`We have recorded a payment of ${formatMoney(extra.paid, money.currency)} towards your ${serviceName}.`],
                sections: [...details.sections, paymentSection(transaction, [
                    { label: "This payment", value: formatMoney(extra.paid, money.currency) },
                    { label: "Outstanding balance", value: formatMoney(extra.balance, money.currency) },
                ])],
                steps: ["Pay the outstanding balance before the deadline shared by our team.", "We'll send a receipt once the full amount is received."],
            }
        case MailKinds.declined:
            return {
                ...base,
                subject: `Payment declined – ${details.title} (${reference})`,
                banner: { ...BANNERS.danger, label: "Payment declined" },
                title: details.title,
                paragraphs: [
                    `Unfortunately your payment for your ${serviceName} was not successful, so nothing has been confirmed yet.`,
                    extra.reason ? `Reason given: ${extra.reason}.` : "No money was taken for this payment attempt. If you were debited, the amount will be reversed by your bank.",
                ],
                sections: [
                    ...details.sections,
                    paymentSection(transaction, [{ label: "Reason", value: extra.reason }]),
                    ...(gatewayRows(transaction).length ? [{ title: "Unified Payment record", rows: gatewayRows(transaction) }] : []),
                ],
                steps: ["Try again on the Unified Payment checkout page or pay by direct bank transfer.", "Reply to this email if you need help completing your booking."],
            }
        case MailKinds.hotel_confirmed:
            return {
                ...base,
                subject: `Booking confirmed – ${details.title}, ${formatDate(extra.booking?.checkin, "D MMM")} (${reference})`,
                banner: { ...BANNERS.success, label: "Booking confirmed" },
                title: details.title,
                paragraphs: ["Your hotel booking is confirmed. Show your voucher (or this email) at check-in together with the passport of the lead guest."],
                sections: [...details.sections, paymentSection(transaction)],
                steps: ["Download your voucher using the button below.", "Taxes marked as payable at the hotel are settled at check-in.", "Need to change or cancel? Reply to this email before the free cancellation deadline."],
                action: { label: "View booking and voucher", url: `${FRONTEND_URL}/hotel-booking/${extra.booking?.id}` },
            }
        case MailKinds.hotel_failed:
            return {
                ...base,
                subject: `We couldn't confirm your hotel – ${details.title} (${reference})`,
                banner: { ...BANNERS.danger, label: "Booking not confirmed" },
                title: details.title,
                paragraphs: [
                    "We're sorry: the hotel could not confirm this room after your payment (it may have sold out while we were confirming).",
                    "Our team has been alerted and will contact you shortly to offer an alternative or a full refund.",
                ],
                sections: [...details.sections, paymentSection(transaction, [{ label: "Reason", value: extra.reason }])],
            }
        case MailKinds.hotel_attention:
            return {
                ...base,
                subject: `Your hotel booking needs a quick review – ${details.title} (${reference})`,
                banner: { ...BANNERS.info, label: "Under review" },
                title: details.title,
                paragraphs: ["We received your payment, but the hotel's price or availability changed before we could confirm the room. Our team is reviewing it now and will contact you shortly."],
                sections: [...details.sections, paymentSection(transaction, [{ label: "Reason", value: extra.reason }])],
            }
        case MailKinds.hotel_cancelled: {
            const cancellation = extra.booking?.cancellation ?? {}
            return {
                ...base,
                subject: `Booking cancelled – ${details.title} (${reference})`,
                banner: { ...BANNERS.neutral, label: "Booking cancelled" },
                title: details.title,
                paragraphs: ["Your hotel booking has been cancelled. Any refund due will be processed by our team to your original payment method."],
                sections: [...details.sections, {
                    title: "Cancellation",
                    rows: compactRows([
                        { label: "Cancelled on", value: formatDate(extra.booking?.cancelledAt, "D MMM YYYY, HH:mm") },
                        { label: "Cancellation fee", value: cancellation.penalty !== undefined ? formatMoney(cancellation.penalty, cancellation.currency) : null },
                        { label: "Refund due", value: cancellation.refund !== undefined ? formatMoney(cancellation.refund, cancellation.currency) : null },
                    ]),
                }],
            }
        }
        default:
            throw new Error(`Unknown mail kind ${kind}`)
    }
}

const ADMIN_TITLES = {
    received: "New order",
    paid: "Payment received",
    part_paid: "Part payment recorded",
    declined: "Payment declined",
    hotel_confirmed: "Hotel booking confirmed",
    hotel_failed: "ACTION NEEDED: hotel booking failed after payment",
    hotel_attention: "ACTION NEEDED: hotel booking needs review",
    hotel_cancelled: "Hotel booking cancelled",
}

/**
 * Sends the customer email and an admin copy (with customer contact details).
 * Never throws: a mail problem must not break payments or bookings.
 */
export async function sendTransactionMail(transaction, kind, extra = {}) {
    // Certification / test scripts run the real flows without emailing anyone
    if (process.env.DISABLE_TRANSACTION_MAIL === "true") return
    try {
        const mail = await composeMail(transaction, kind, extra)
        const customer = mail.details.customer ?? {}
        const admin = await db.Users.findOne({ where: { role: USER_TYPES.admin } })
        const context = {
            title: mail.title,
            reference: mail.reference,
            banner: mail.banner,
            paragraphs: mail.paragraphs,
            sections: mail.sections,
            totals: mail.totals,
            steps: mail.steps,
            action: mail.action,
            serviceName: mail.serviceName,
            sentAt: dayjs().format("D MMM YYYY, HH:mm"),
        }

        const body = []
        if (customer.email) {
            body.push({ fullname: customer.name || "there", mailTo: customer.email, subject: mail.subject, template: "transaction", context })
        }
        if (admin?.email) {
            body.push({
                fullname: admin.firstName || "Admin",
                mailTo: admin.email,
                subject: `[${ADMIN_TITLES[kind] ?? kind}] ${mail.subject}`,
                template: "transaction",
                context: {
                    ...context,
                    action: undefined,
                    steps: undefined,
                    paragraphs: [`${ADMIN_TITLES[kind] ?? kind} for a ${mail.serviceName}.`, ...(extra.reason ? [`Reason: ${extra.reason}`] : [])],
                    sections: [
                        { title: "Customer", rows: compactRows([{ label: "Name", value: customer.name }, { label: "Email", value: customer.email }, { label: "Phone", value: customer.phone }]) },
                        ...mail.sections,
                    ],
                },
            })
        }
        if (body.length) runJobs(`Email-${kind}-${transaction?.id ?? "na"}`, JOB_FILES.email, { body })
    } catch (error) {
        logger.error(`[mail] could not send ${kind} email for transaction ${transaction?.id}: ${error.message}`)
    }
}
