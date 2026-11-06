import dayjs from "dayjs"
import { Op } from "sequelize"
import db from "../repository/dashboard.repository.js"
import { JsonResponse, roundDecimal, ServerError, TransactionTypes } from "../../../config/utilities.js"
import { HotelContentStatus } from "../../../database/models/hotelModel.js"
import { BUSINESS_LINES, currentMarkups, loadTransactions } from "../services/business-lines.js"

/**
 * Admin dashboard metrics, reported per business line (hotels, packages, visa, airport transfers).
 * Money is in NGN. Revenue counts PAID transactions; margin is the markup share of what the
 * customer paid (VAT excluded), recorded on the transaction or estimated from the line's
 * current markup when the transaction predates markup recording.
 */

export const RANGES = {
    "7d": { label: "Last 7 days", amount: 7, unit: "day", bucket: "day" },
    "30d": { label: "Last 30 days", amount: 30, unit: "day", bucket: "day" },
    "90d": { label: "Last 90 days", amount: 90, unit: "day", bucket: "week" },
    "12m": { label: "Last 12 months", amount: 12, unit: "month", bucket: "month" },
}
export const DASHBOARD_RANGES = Object.keys(RANGES)

export const change = (current, previous) => (previous ? roundDecimal(((current - previous) / previous) * 100, 1) : null)
export const kpi = (current, previous) => ({ value: roundDecimal(current, 2), previous: roundDecimal(previous, 2), change: change(current, previous) })
const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0)
const percent = (part, whole) => (whole ? roundDecimal((part / whole) * 100, 1) : 0)

export function resolveRange(rangeKey, fallback = "30d") {
    const key = RANGES[rangeKey] ? rangeKey : fallback
    const range = RANGES[key]
    const end = dayjs()
    const start = end.subtract(range.amount, range.unit)
    const previousStart = start.subtract(range.amount, range.unit)
    return {
        key, range, end, start, previousStart,
        inPeriod: { [Op.gte]: start.toDate(), [Op.lt]: end.toDate() },
        inPrevious: { [Op.gte]: previousStart.toDate(), [Op.lt]: start.toDate() },
    }
}

export function buildBuckets(start, end, bucket) {
    const buckets = []
    let cursor = start.startOf(bucket === "week" ? "day" : bucket)
    while (cursor.isBefore(end)) {
        const next = cursor.add(1, bucket)
        buckets.push({ start: cursor, end: next, label: bucket === "month" ? cursor.format("MMM YYYY") : cursor.format("D MMM") })
        cursor = next
    }
    return buckets
}

export const bucketIndex = (buckets, date) => {
    const day = dayjs(date)
    return buckets.findIndex((bucket) => !day.isBefore(bucket.start) && day.isBefore(bucket.end))
}

function summarise(transactions) {
    const paid = transactions.filter((tx) => tx.isPaid)
    const awaiting = transactions.filter((tx) => tx.isAwaiting)
    const revenue = sum(paid, (tx) => tx.naira)
    return {
        revenue,
        margin: sum(paid, (tx) => tx.margin),
        vat: sum(paid, (tx) => tx.vat),
        paidCount: paid.length,
        averageValue: paid.length ? revenue / paid.length : 0,
        conversion: percent(paid.length, transactions.length),
        awaitingValue: sum(awaiting, (tx) => tx.naira),
        awaitingCount: awaiting.length,
        estimatedMargin: paid.some((tx) => tx.marginEstimated),
    }
}

export const GetDashboard = async (req, res) => {
    try {
        const { key, range, end, start, previousStart, inPeriod, inPrevious } = resolveRange(req.query.range)
        const markups = await currentMarkups()

        const [
            transactions,
            tripEnquiries, visaEnquiries, transferOrders,
            previousEnquiries,
            subscribers, previousSubscribers, contacts, previousContacts,
            hotelsSynced, hotelsPending, hotelRegions, hotelPrebooks, previousPrebooks, lastSync,
        ] = await Promise.all([
            loadTransactions({ createdAt: { [Op.gte]: previousStart.toDate(), [Op.lt]: end.toDate() } }, markups),
            db.TripEnquiries.findAll({ where: { createdAt: inPeriod }, attributes: ["id", "tripId"], raw: true }),
            db.VisaEnquiries.count({ where: { createdAt: inPeriod } }),
            db.Transfers.count({ where: { createdAt: inPeriod } }),
            Promise.all([
                db.TripEnquiries.count({ where: { createdAt: inPrevious } }),
                db.VisaEnquiries.count({ where: { createdAt: inPrevious } }),
                db.Transfers.count({ where: { createdAt: inPrevious } }),
            ]),
            db.NewsLetters.count({ where: { createdAt: inPeriod } }),
            db.NewsLetters.count({ where: { createdAt: inPrevious } }),
            db.Contacts.count({ where: { createdAt: inPeriod } }),
            db.Contacts.count({ where: { createdAt: inPrevious } }),
            db.Hotels.count({ where: { contentStatus: HotelContentStatus.synced, deleted: false } }),
            db.Hotels.count({ where: { contentStatus: HotelContentStatus.pending } }),
            db.HotelRegions.count({ where: { hotelsCount: { [Op.gt]: 0 } } }),
            db.HotelPrebooks.count({ where: { createdAt: inPeriod } }),
            db.HotelPrebooks.count({ where: { createdAt: inPrevious } }),
            db.HotelSyncLogs.findOne({ order: [["startedAt", "DESC"]], attributes: ["scope", "status", "startedAt", "finishedAt", "error"] }),
        ])

        const current = transactions.filter((tx) => !dayjs(tx.createdAt).isBefore(start))
        const previous = transactions.filter((tx) => dayjs(tx.createdAt).isBefore(start))
        const now = summarise(current)
        const before = summarise(previous)

        // Requests per line: what customers asked for, before any payment
        const requests = { hotels: hotelPrebooks, packages: tripEnquiries.length, visa: visaEnquiries, transfers: transferOrders }
        const enquiriesNow = tripEnquiries.length + visaEnquiries + transferOrders
        const enquiriesBefore = sum(previousEnquiries, (count) => count)

        // ---------------------------------------------------------------- per business line
        const businessLines = BUSINESS_LINES.map((line) => {
            const lineNow = summarise(current.filter((tx) => tx.line === line.key))
            const lineBefore = summarise(previous.filter((tx) => tx.line === line.key))
            return {
                key: line.key,
                label: line.label,
                revenue: kpi(lineNow.revenue, lineBefore.revenue),
                margin: kpi(lineNow.margin, lineBefore.margin),
                margin_rate: percent(lineNow.margin, lineNow.revenue),
                margin_estimated: lineNow.estimatedMargin,
                vat: roundDecimal(lineNow.vat, 2),
                paid_bookings: kpi(lineNow.paidCount, lineBefore.paidCount),
                average_booking_value: roundDecimal(lineNow.averageValue, 2),
                awaiting: { value: roundDecimal(lineNow.awaitingValue, 2), count: lineNow.awaitingCount },
                conversion_rate: lineNow.conversion,
                requests: requests[line.key],
                revenue_share: percent(lineNow.revenue, now.revenue),
                margin_share: percent(lineNow.margin, now.margin),
                current_markup: markups[line.key],
            }
        })

        // ---------------------------------------------------------------- time series
        const buckets = buildBuckets(start, end, range.bucket)
        const revenueSeries = BUSINESS_LINES.map((line) => ({ line: line.key, revenue: buckets.map(() => 0), margin: buckets.map(() => 0) }))
        const createdSeries = buckets.map(() => 0)
        const paidSeries = buckets.map(() => 0)
        for (const tx of current) {
            const index = bucketIndex(buckets, tx.createdAt)
            if (index < 0) continue
            createdSeries[index] += 1
            if (!tx.isPaid) continue
            paidSeries[index] += 1
            const series = revenueSeries.find((item) => item.line === tx.line)
            if (series) {
                series.revenue[index] += tx.naira
                series.margin[index] += tx.margin
            }
        }

        // ---------------------------------------------------------------- breakdowns
        const paidNow = current.filter((tx) => tx.isPaid)
        const paymentStatus = [...new Set(current.map((tx) => tx.paymentStatus))].map((status) => {
            const items = current.filter((tx) => tx.paymentStatus === status)
            return { status, count: items.length, value: roundDecimal(sum(items, (tx) => tx.naira), 2) }
        }).sort((a, b) => b.count - a.count)

        const paymentMethods = [...new Set(paidNow.map((tx) => tx.paymentType))].map((method) => {
            const items = paidNow.filter((tx) => tx.paymentType === method)
            const revenue = sum(items, (tx) => tx.naira)
            return { method, count: items.length, revenue: roundDecimal(revenue, 2), share: percent(revenue, now.revenue) }
        }).sort((a, b) => b.revenue - a.revenue)

        // Top packages: enquiries in the period, revenue and margin from their paid transactions
        const enquiryTrip = new Map(tripEnquiries.map((enquiry) => [enquiry.id, enquiry.tripId]))
        const packageStats = new Map()
        for (const enquiry of tripEnquiries) {
            const stats = packageStats.get(enquiry.tripId) ?? { enquiries: 0, revenue: 0, margin: 0, paid: 0 }
            stats.enquiries += 1
            packageStats.set(enquiry.tripId, stats)
        }
        for (const tx of paidNow.filter((item) => item.txType === TransactionTypes.trip)) {
            const stats = packageStats.get(enquiryTrip.get(tx.tripId))
            if (stats) { stats.revenue += tx.naira; stats.margin += tx.margin; stats.paid += 1 }
        }
        const topIds = [...packageStats.entries()].sort(([, a], [, b]) => b.revenue - a.revenue || b.enquiries - a.enquiries).slice(0, 5).map(([id]) => id)
        const trips = topIds.length ? await db.Trips.findAll({ where: { id: topIds }, attributes: ["id", "title"], raw: true }) : []
        const topPackages = topIds.map((id) => ({
            trip_id: id,
            title: trips.find((trip) => trip.id === id)?.title?.trim() ?? "Removed package",
            enquiries: packageStats.get(id).enquiries,
            paid: packageStats.get(id).paid,
            revenue: roundDecimal(packageStats.get(id).revenue, 2),
            margin: roundDecimal(packageStats.get(id).margin, 2),
        }))

        return JsonResponse(res, 200, {
            range: { key, label: range.label, start: start.toISOString(), end: end.toISOString(), bucket: range.bucket },
            currency: "NGN",
            kpis: {
                revenue: kpi(now.revenue, before.revenue),
                gross_margin: { ...kpi(now.margin, before.margin), rate: percent(now.margin, now.revenue), estimated: now.estimatedMargin },
                paid_bookings: kpi(now.paidCount, before.paidCount),
                average_booking_value: kpi(now.averageValue, before.averageValue),
                conversion_rate: kpi(now.conversion, before.conversion),
                awaiting_payment: { ...kpi(now.awaitingValue, before.awaitingValue), count: now.awaitingCount },
                new_enquiries: kpi(enquiriesNow, enquiriesBefore),
                new_subscribers: kpi(subscribers, previousSubscribers),
                new_contacts: kpi(contacts, previousContacts),
            },
            business_lines: businessLines,
            revenue_series: {
                buckets: buckets.map((bucket) => bucket.label),
                series: revenueSeries.map((item) => ({
                    line: item.line,
                    revenue: item.revenue.map((value) => roundDecimal(value, 2)),
                    margin: item.margin.map((value) => roundDecimal(value, 2)),
                })),
            },
            bookings_series: { buckets: buckets.map((bucket) => bucket.label), created: createdSeries, paid: paidSeries },
            payment_status: paymentStatus,
            payment_methods: paymentMethods,
            top_packages: topPackages,
            hotels: {
                synced: hotelsSynced,
                pending_content: hotelsPending,
                regions: hotelRegions,
                prebooks: kpi(hotelPrebooks, previousPrebooks),
                last_sync: lastSync,
            },
            recent_transactions: current.slice(0, 8).map((tx) => ({
                id: tx.id,
                txid: tx.txid,
                line: tx.line,
                status: tx.paymentStatus,
                method: tx.paymentType,
                amount: roundDecimal(tx.naira, 2),
                margin: roundDecimal(tx.margin, 2),
                created_at: dayjs(tx.createdAt).toISOString(),
            })),
        })
    } catch (error) {
        ServerError(res, error, "error building dashboard")
    }
}
