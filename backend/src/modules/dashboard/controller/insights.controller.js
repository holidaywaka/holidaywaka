import dayjs from "dayjs"
import { Op } from "sequelize"
import db from "../repository/dashboard.repository.js"
import { JsonResponse, MainStatusOptions, roundDecimal, safeParse, ServerError, ServerTransactionStatusOptions } from "../../../config/utilities.js"
import { BUSINESS_LINES, currentMarkups, loadTransactions } from "../services/business-lines.js"
import { bucketIndex, buildBuckets, change, resolveRange } from "./dashboard.controller.js"

/**
 * Admin insights: where revenue and margin come from over time, how each business line
 * converts, when and where customers travel, and who the best customers are.
 * Money in NGN; the same definitions as the dashboard apply.
 */

const LEAD_TIME_BUCKETS = [
    { label: "0-7 days", max: 7 },
    { label: "8-30 days", max: 30 },
    { label: "31-60 days", max: 60 },
    { label: "61-90 days", max: 90 },
    { label: "90+ days", max: Infinity },
]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const PAYMENT_STARTED = [ServerTransactionStatusOptions.submitted, ServerTransactionStatusOptions.part_paid, ServerTransactionStatusOptions.paid]

const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0)
const percent = (part, whole) => (whole ? roundDecimal((part / whole) * 100, 1) : 0)
const asObject = (value) => {
    const parsed = typeof value === "string" ? safeParse(value) : value
    return parsed && typeof parsed === "object" ? parsed : null
}
const median = (values) => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}
const naira = (value) => `₦${Math.round(value).toLocaleString("en-NG")}`
const lineLabel = (key) => BUSINESS_LINES.find((line) => line.key === key)?.label ?? key
const plural = (count, word, pluralWord = `${word}s`) => `${count} ${count === 1 ? word : pluralWord}`

function topEntries(map, limit = 8) {
    return [...map.entries()]
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue || b.requests - a.requests)
        .slice(0, limit)
        .map((item) => ({ ...item, revenue: roundDecimal(item.revenue, 2) }))
}

export const GetInsights = async (req, res) => {
    try {
        const { key, range, end, start, previousStart, inPeriod } = resolveRange(req.query.range, "12m")
        const markups = await currentMarkups()

        const [transactions, tripEnquiries, visaEnquiries, transferOrders, prebooks, activeRate] = await Promise.all([
            loadTransactions({ createdAt: { [Op.gte]: previousStart.toDate(), [Op.lt]: end.toDate() } }, markups),
            db.TripEnquiries.findAll({ where: { createdAt: inPeriod }, attributes: ["id", "tripId", "travelers", "travelDate", "tripType", "createdAt"] }),
            db.VisaEnquiries.findAll({ where: { createdAt: inPeriod }, attributes: ["id", "firstName", "lastName", "email", "visa", "travelDate", "status", "createdAt"] }),
            db.Transfers.findAll({ where: { createdAt: inPeriod }, attributes: ["id", "createdAt"], raw: true }),
            db.HotelPrebooks.findAll({
                where: { createdAt: inPeriod },
                attributes: ["id", "hid", "amount", "currency", "checkin", "checkout", "priceChanged", "createdAt"],
                include: [{ model: db.Hotels, attributes: ["regionId"], include: [{ model: db.HotelRegions, attributes: ["name", "countryCode"] }] }],
            }),
            db.Rates.findOne({ where: { status: MainStatusOptions.true }, order: [["updatedAt", "DESC"]] }),
        ])

        const current = transactions.filter((tx) => !dayjs(tx.createdAt).isBefore(start))
        const previous = transactions.filter((tx) => dayjs(tx.createdAt).isBefore(start))
        const paidNow = current.filter((tx) => tx.isPaid)
        const totalRevenue = sum(paidNow, (tx) => tx.naira)
        const totalMargin = sum(paidNow, (tx) => tx.margin)
        const usdRate = Number((Array.isArray(activeRate?.quotes) ? activeRate.quotes : []).find((item) => item.quote === "USD")?.value) || 0

        // ---------------------------------------------------------------- revenue & margin trend per line
        const buckets = buildBuckets(start, end, range.bucket === "day" ? "week" : range.bucket)
        const trends = BUSINESS_LINES.map((line) => {
            const revenue = buckets.map(() => 0)
            const margin = buckets.map(() => 0)
            for (const tx of paidNow.filter((item) => item.line === line.key)) {
                const index = bucketIndex(buckets, tx.createdAt)
                if (index < 0) continue
                revenue[index] += tx.naira
                margin[index] += tx.margin
            }
            const lineRevenue = sum(revenue, (value) => value)
            const lineMargin = sum(margin, (value) => value)
            const previousRevenue = sum(previous.filter((tx) => tx.isPaid && tx.line === line.key), (tx) => tx.naira)
            return {
                line: line.key,
                label: line.label,
                revenue: revenue.map((value) => roundDecimal(value, 2)),
                margin: margin.map((value) => roundDecimal(value, 2)),
                total_revenue: roundDecimal(lineRevenue, 2),
                total_margin: roundDecimal(lineMargin, 2),
                margin_rate: percent(lineMargin, lineRevenue),
                revenue_change: change(lineRevenue, previousRevenue),
                revenue_share: percent(lineRevenue, totalRevenue),
                margin_share: percent(lineMargin, totalMargin),
            }
        })

        // ---------------------------------------------------------------- conversion funnels
        const requests = { hotels: prebooks.length, packages: tripEnquiries.length, visa: visaEnquiries.length, transfers: transferOrders.length }
        const requestLabels = { hotels: "Rooms prebooked", packages: "Package enquiries", visa: "Visa applications", transfers: "Transfer orders" }
        const funnels = BUSINESS_LINES.map((line) => {
            const lineTx = current.filter((tx) => tx.line === line.key)
            const steps = [
                { label: requestLabels[line.key], count: requests[line.key] },
                { label: "Checkout started", count: lineTx.length },
                { label: "Payment made", count: lineTx.filter((tx) => PAYMENT_STARTED.includes(tx.paymentStatus)).length },
                { label: "Fully paid", count: lineTx.filter((tx) => tx.isPaid).length },
            ]
            return {
                line: line.key,
                label: line.label,
                steps: steps.map((step, index) => ({ ...step, rate_from_previous: index === 0 ? null : percent(step.count, steps[index - 1].count) })),
                overall_rate: percent(steps[3].count, steps[0].count),
            }
        })

        // ---------------------------------------------------------------- lead time, seasonality, weekday
        const travelRequests = [
            ...tripEnquiries.map((item) => ({ line: "packages", created: item.createdAt, travel: item.travelDate })),
            ...visaEnquiries.map((item) => ({ line: "visa", created: item.createdAt, travel: item.travelDate })),
            ...prebooks.map((item) => ({ line: "hotels", created: item.createdAt, travel: item.checkin })),
        ].map((item) => ({ ...item, travel: item.travel ? dayjs(item.travel) : null }))
            .filter((item) => item.travel?.isValid())

        const leadDays = travelRequests
            .map((item) => ({ line: item.line, days: item.travel.startOf("day").diff(dayjs(item.created).startOf("day"), "day") }))
            .filter((item) => item.days >= 0)
        const leadTime = {
            buckets: LEAD_TIME_BUCKETS.map((bucket, index) => ({
                label: bucket.label,
                count: leadDays.filter((item) => item.days <= bucket.max && item.days > (LEAD_TIME_BUCKETS[index - 1]?.max ?? -1)).length,
            })),
            median_days: median(leadDays.map((item) => item.days)),
            by_line: BUSINESS_LINES.map((line) => ({ line: line.key, median_days: median(leadDays.filter((item) => item.line === line.key).map((item) => item.days)) })),
            sample: leadDays.length,
        }

        const seasonality = {
            months: MONTHS,
            series: ["hotels", "packages", "visa"].map((lineKey) => ({
                line: lineKey,
                values: MONTHS.map((_, month) => travelRequests.filter((item) => item.line === lineKey && item.travel.month() === month).length),
            })),
        }

        const allRequests = [
            ...tripEnquiries.map((item) => item.createdAt),
            ...visaEnquiries.map((item) => item.createdAt),
            ...transferOrders.map((item) => item.createdAt),
            ...prebooks.map((item) => item.createdAt),
        ]
        const requestWeekdays = WEEKDAYS.map((label, day) => ({ label, count: allRequests.filter((date) => dayjs(date).day() === day).length }))

        // ---------------------------------------------------------------- destinations
        const enquiryById = new Map(tripEnquiries.map((item) => [item.id, item]))
        const visaById = new Map(visaEnquiries.map((item) => [item.id, item]))
        const tripIds = [...new Set(tripEnquiries.map((item) => item.tripId).filter(Boolean))]
        const trips = tripIds.length ? await db.Trips.findAll({ where: { id: tripIds }, attributes: ["id", "title", "destinations"] }) : []
        const tripCountry = new Map(trips.map((trip) => {
            const destinations = asObject(trip.destinations)
            return [trip.id, (Array.isArray(destinations) ? destinations[0]?.country : null) ?? trip.title?.trim() ?? "Unknown"]
        }))

        const packageDestinations = new Map()
        for (const enquiry of tripEnquiries) {
            const name = tripCountry.get(enquiry.tripId) ?? "Unknown"
            const stats = packageDestinations.get(name) ?? { requests: 0, revenue: 0 }
            stats.requests += 1
            packageDestinations.set(name, stats)
        }
        const visaDestinations = new Map()
        for (const enquiry of visaEnquiries) {
            const name = asObject(enquiry.visa)?.country ?? "Unknown"
            const stats = visaDestinations.get(name) ?? { requests: 0, revenue: 0 }
            stats.requests += 1
            visaDestinations.set(name, stats)
        }
        const hotelDestinations = new Map()
        for (const prebook of prebooks) {
            const name = prebook.Hotel?.HotelRegion?.name ?? "Unknown"
            const stats = hotelDestinations.get(name) ?? { requests: 0, revenue: 0 }
            stats.requests += 1
            hotelDestinations.set(name, stats)
        }
        for (const tx of paidNow) {
            if (tx.line === "packages") {
                const name = tripCountry.get(enquiryById.get(tx.tripId)?.tripId)
                if (name && packageDestinations.has(name)) packageDestinations.get(name).revenue += tx.naira
            }
            if (tx.line === "visa") {
                const name = asObject(visaById.get(tx.visaId)?.visa)?.country
                if (name && visaDestinations.has(name)) visaDestinations.get(name).revenue += tx.naira
            }
        }

        // ---------------------------------------------------------------- customers
        const customerOf = new Map() // request id -> { email, name }
        for (const enquiry of tripEnquiries) {
            const lead = (asObject(enquiry.travelers) ?? [])[0]
            if (lead?.email) customerOf.set(enquiry.id, { email: lead.email.toLowerCase(), name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") })
        }
        for (const enquiry of visaEnquiries) {
            if (enquiry.email) customerOf.set(enquiry.id, { email: enquiry.email.toLowerCase(), name: [enquiry.firstName, enquiry.lastName].filter(Boolean).join(" ") })
        }
        const customers = new Map()
        for (const [, customer] of customerOf) {
            const stats = customers.get(customer.email) ?? { name: customer.name, email: customer.email, requests: 0, paid_bookings: 0, spend: 0, margin: 0 }
            stats.requests += 1
            if (!stats.name && customer.name) stats.name = customer.name
            customers.set(customer.email, stats)
        }
        for (const tx of paidNow) {
            const customer = customerOf.get(tx.tripId) ?? customerOf.get(tx.visaId)
            const stats = customer && customers.get(customer.email)
            if (stats) { stats.paid_bookings += 1; stats.spend += tx.naira; stats.margin += tx.margin }
        }
        const customerList = [...customers.values()]
        const payingCustomers = customerList.filter((item) => item.paid_bookings > 0)
        const groupSizes = tripEnquiries.map((item) => (asObject(item.travelers) ?? []).length).filter((size) => size > 0)
        const tripTypes = new Map()
        for (const enquiry of tripEnquiries) tripTypes.set(enquiry.tripType ?? "UNKNOWN", (tripTypes.get(enquiry.tripType ?? "UNKNOWN") ?? 0) + 1)

        const customerInsights = {
            unique_customers: customerList.length,
            paying_customers: payingCustomers.length,
            repeat_customers: customerList.filter((item) => item.requests > 1).length,
            repeat_rate: percent(customerList.filter((item) => item.requests > 1).length, customerList.length),
            average_spend: payingCustomers.length ? roundDecimal(sum(payingCustomers, (item) => item.spend) / payingCustomers.length, 2) : 0,
            average_group_size: groupSizes.length ? roundDecimal(sum(groupSizes, (size) => size) / groupSizes.length, 1) : null,
            trip_types: [...tripTypes.entries()].map(([type, count]) => ({ type, count, share: percent(count, tripEnquiries.length) })),
            top_customers: payingCustomers
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 5)
                .map((item) => ({ ...item, spend: roundDecimal(item.spend, 2), margin: roundDecimal(item.margin, 2) })),
        }

        // ---------------------------------------------------------------- hotels
        const prebookNaira = prebooks.map((item) => {
            const amount = Number(item.amount) || 0
            return item.currency === "NGN" ? amount : amount * (usdRate || 1)
        })
        const nights = prebooks.map((item) => dayjs(item.checkout).diff(dayjs(item.checkin), "day")).filter((value) => value > 0)
        const hotelInsights = {
            prebooks: prebooks.length,
            prebook_value: roundDecimal(sum(prebookNaira, (value) => value), 2),
            average_prebook_value: prebooks.length ? roundDecimal(sum(prebookNaira, (value) => value) / prebooks.length, 2) : 0,
            average_nights: nights.length ? roundDecimal(sum(nights, (value) => value) / nights.length, 1) : null,
            price_change_rate: percent(prebooks.filter((item) => item.priceChanged).length, prebooks.length),
            hotel_bookings: current.filter((tx) => tx.line === "hotels").length,
        }

        // ---------------------------------------------------------------- takeaways
        const takeaways = []
        const earning = trends.filter((item) => item.total_revenue > 0).sort((a, b) => b.total_revenue - a.total_revenue)
        if (earning.length) {
            const top = earning[0]
            takeaways.push({ tone: "info", text: `${top.label} brought in ${top.revenue_share}% of revenue (${naira(top.total_revenue)}) and ${top.margin_share}% of gross margin.` })
            const bestMargin = [...earning].sort((a, b) => b.margin_rate - a.margin_rate)[0]
            if (earning.length > 1) takeaways.push({ tone: "positive", text: `${bestMargin.label} has the best margin at ${bestMargin.margin_rate}% of sales.` })
            const declining = earning.filter((item) => item.revenue_change !== null && item.revenue_change < 0).sort((a, b) => a.revenue_change - b.revenue_change)[0]
            if (declining) takeaways.push({ tone: "negative", text: `${declining.label} revenue is down ${Math.abs(declining.revenue_change)}% on the previous period.` })
            const growing = earning.filter((item) => item.revenue_change !== null && item.revenue_change > 0).sort((a, b) => b.revenue_change - a.revenue_change)[0]
            if (growing) takeaways.push({ tone: "positive", text: `${growing.label} revenue is up ${growing.revenue_change}% on the previous period.` })
        } else {
            takeaways.push({ tone: "negative", text: "No paid bookings in this period." })
        }
        // Only lines customers can actually pay for online (hotel checkout is not live until booking ships)
        const weakFunnel = funnels.filter((item) => item.steps[0].count >= 3 && item.steps[1].count > 0).sort((a, b) => a.overall_rate - b.overall_rate)[0]
        if (weakFunnel) takeaways.push({ tone: "negative", text: `Only ${weakFunnel.overall_rate}% of ${weakFunnel.steps[0].label.toLowerCase()} end up fully paid - the weakest conversion of any business line.` })
        const awaiting = current.filter((tx) => tx.isAwaiting)
        if (awaiting.length) takeaways.push({ tone: "negative", text: `${naira(sum(awaiting, (tx) => tx.naira))} is still awaiting payment across ${plural(awaiting.length, "transaction")} - worth a follow-up.` })
        const commonLead = [...leadTime.buckets].sort((a, b) => b.count - a.count)[0]
        if (leadTime.sample >= 3 && commonLead.count) takeaways.push({ tone: "info", text: `Most customers book ${commonLead.label} before travel (median ${leadTime.median_days} days) - time campaigns accordingly.` })
        const monthTotals = MONTHS.map((month, index) => ({ month, count: sum(seasonality.series, (series) => series.values[index]) }))
        const peak = [...monthTotals].sort((a, b) => b.count - a.count)[0]
        if (peak?.count >= 2) takeaways.push({ tone: "info", text: `${dayjs().month(MONTHS.indexOf(peak.month)).format("MMMM")} is the most requested travel month.` })
        const topPackageDestination = [...packageDestinations.entries()].map(([name, stats]) => ({ name, ...stats })).sort((x, y) => y.requests - x.requests)[0]
        if (topPackageDestination) takeaways.push({ tone: "info", text: `${topPackageDestination.name} is the most requested package destination (${plural(topPackageDestination.requests, "enquiry", "enquiries")}).` })
        if (customerInsights.repeat_customers) takeaways.push({ tone: "positive", text: `${plural(customerInsights.repeat_customers, "customer")} came back more than once (${customerInsights.repeat_rate}% repeat rate).` })
        if (hotelInsights.prebooks && !hotelInsights.hotel_bookings) takeaways.push({ tone: "info", text: `${plural(hotelInsights.prebooks, "hotel room")} prebooked; hotel revenue starts once online hotel booking goes live.` })

        return JsonResponse(res, 200, {
            range: { key, label: range.label, start: start.toISOString(), end: end.toISOString(), bucket: range.bucket === "day" ? "week" : range.bucket },
            currency: "NGN",
            totals: { revenue: roundDecimal(totalRevenue, 2), margin: roundDecimal(totalMargin, 2), margin_rate: percent(totalMargin, totalRevenue), margin_estimated: paidNow.some((tx) => tx.marginEstimated) },
            takeaways,
            trends: { buckets: buckets.map((bucket) => bucket.label), lines: trends },
            funnels,
            lead_time: leadTime,
            seasonality,
            request_weekdays: requestWeekdays,
            destinations: {
                packages: topEntries(packageDestinations),
                visa: topEntries(visaDestinations),
                hotels: topEntries(hotelDestinations),
            },
            customers: customerInsights,
            hotels: hotelInsights,
            lines: BUSINESS_LINES.map((line) => ({ key: line.key, label: lineLabel(line.key) })),
        })
    } catch (error) {
        ServerError(res, error, "error building insights")
    }
}
