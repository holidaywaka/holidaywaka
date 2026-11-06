import ratehawkConfig, { RatehawkError } from "../services/ratwhawk.config.js";
import { JsonResponse, ServerError } from "../../../config/utilities.js"
import logger from "../../../middleware/logger.js";
import db from "../repository/hotels.repository.js";
import { HotelContentStatus } from "../../../database/models/hotelModel.js";
import { runHotelSync } from "../services/content-sync.service.js";
import {
    getFilterReference,
    getHotelContent,
    getHotelRates,
    getPrebook,
    popularDestinations,
    HotelServiceError,
    prebookRate,
    searchDestinations,
    searchHotelsByRegion,
    toStayParams,
} from "../services/hotel-search.service.js";
import {
    cancelHotelBooking,
    createHotelCheckout,
    downloadVoucher,
    getBooking,
    handleEtgWebhook,
    listBookings,
    refreshOrderInfo,
    retryHotelBooking,
} from "../services/hotel-booking.service.js";

// Never surface 401/403 for supplier failures: the frontend treats those as an expired session
function HotelError(res, error, title) {
    if (error instanceof HotelServiceError) {
        return JsonResponse(res, error.status, { message: error.message, code: error.code })
    }
    if (error instanceof RatehawkError) {
        logger.error(`${title}: ${error.message} ${error.debug ? JSON.stringify(error.debug) : ''}`)
        if (error.code === "invalid_params") {
            return JsonResponse(res, 422, { message: "Some search details are not accepted by the supplier. Please review and try again.", code: error.code })
        }
        return JsonResponse(res, 502, { message: "Our hotel supplier is not responding right now. Please try again shortly.", code: error.code })
    }
    return ServerError(res, error, title)
}

// ======================== static content (served from our database) ====================

export const hotelDestinations = async (req, res) => {
    try {
        const result = await searchDestinations(req.query.q)
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error searching hotel destinations')
    }
}

export const hotelPopularDestinations = async (req, res) => {
    try {
        const result = await popularDestinations(req.query.country)
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving popular destinations')
    }
}

export const hotelFilterReference = async (req, res) => {
    try {
        const result = await getFilterReference()
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel filters')
    }
}

export const singleHotel = async (req, res) => {
    try {
        const result = await getHotelContent(req.params.hid)
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel')
    }
}

// ======================== step 2: search ====================

export const searchHotels = async (req, res) => {
    try {
        const result = await searchHotelsByRegion({
            regionId: req.body.region_id,
            params: toStayParams(req.body),
            viewerCountry: req.body.viewer_country,
            filters: req.body.filters,
            sort: req.body.sort,
            page: req.body.page ?? 1,
            pageSize: req.body.page_size ?? 20,
        })
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error searching hotels')
    }
}

export const hotelPageRates = async (req, res) => {
    try {
        const result = await getHotelRates(req.params.hid, toStayParams(req.body), req.body.viewer_country)
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel rates')
    }
}

// ======================== step 3: prebook ====================

export const hotelPrebook = async (req, res) => {
    try {
        const result = await prebookRate(req.body.hid, toStayParams(req.body), req.body.book_hash, req.body.viewer_country)
        return JsonResponse(res, 201, result)
    } catch (error) {
        return HotelError(res, error, 'Error prebooking hotel')
    }
}

export const singlePrebook = async (req, res) => {
    try {
        const result = await getPrebook(req.params.id)
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel reservation')
    }
}

// ======================== admin: step 1 content sync ====================

export const startHotelSync = async (req, res) => {
    try {
        const { log, alreadyRunning } = await runHotelSync(req.body.scope, {
            countries: req.body.countries,
            maxHotels: req.body.max_hotels,
            fullDiscovery: req.body.full_discovery,
        })
        return JsonResponse(res, alreadyRunning ? 409 : 202, {
            message: alreadyRunning ? 'A hotel sync is already running' : 'Hotel sync started',
            data: log,
        })
    } catch (error) {
        return HotelError(res, error, 'Error starting hotel sync')
    }
}

export const hotelSyncLogs = async (req, res) => {
    try {
        const [logs, pending, synced, regions] = await Promise.all([
            db.HotelSyncLogs.findAll({ order: [['startedAt', 'DESC']], limit: 20 }),
            db.Hotels.count({ where: { contentStatus: HotelContentStatus.pending } }),
            db.Hotels.count({ where: { contentStatus: HotelContentStatus.synced } }),
            db.HotelRegions.count(),
        ])
        return JsonResponse(res, 200, { data: logs, totals: { pending, synced, regions } })
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel sync logs')
    }
}

export const retrieveB2BOverview = async (req, res) => {
    try {
        const response = await ratehawkConfig.fetch({
            endpoint: ratehawkConfig.apis.b2b_overview
        });
        return JsonResponse(res, 200, response)
    } catch (error) {
        return HotelError(res, error, 'Error retrieving B2B overview')
    }
}

// ======================== step 4: checkout + booking ====================

const clientIp = (req) => String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket?.remoteAddress?.replace(/^::ffff:/, "") || "127.0.0.1"

export const createHotelBooking = async (req, res) => {
    try {
        const result = await createHotelCheckout({
            prebookId: req.body.prebook_id,
            contact: req.body.contact,
            rooms: req.body.rooms,
            comment: req.body.comment,
            paymentMethod: req.body.payment_method,
            voucherCode: req.body.voucher_code,
            userIp: clientIp(req),
        })
        return JsonResponse(res, 201, result)
    } catch (error) {
        return HotelError(res, error, 'Error creating hotel booking')
    }
}

export const singleHotelBooking = async (req, res) => {
    try {
        return JsonResponse(res, 200, await getBooking(req.params.id))
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel booking')
    }
}

export const hotelBookingVoucher = async (req, res) => {
    try {
        const voucher = await downloadVoucher(req.params.id)
        res.setHeader("Content-Type", voucher.contentType || "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="${voucher.filename}"`)
        return res.status(200).send(voucher.file)
    } catch (error) {
        return HotelError(res, error, 'Error downloading hotel voucher')
    }
}

/** ETG receive-booking-status webhook: answer 200 once processed so ETG stops retrying */
export const hotelBookingWebhook = async (req, res) => {
    try {
        const outcome = await handleEtgWebhook(req.body)
        return JsonResponse(res, 200, { status: "ok", outcome })
    } catch (error) {
        if (error instanceof HotelServiceError && error.code === "invalid_signature") {
            logger.warn(`[hotel-booking] rejected webhook with an invalid signature`)
        }
        return HotelError(res, error, 'Error processing hotel booking webhook')
    }
}

// ======================== admin: bookings ====================

export const adminHotelBookings = async (req, res) => {
    try {
        const result = await listBookings({
            status: req.query.status,
            search: req.query.search,
            // Express 5 req.query is read-only, so the validator's toInt() never reaches here: a string limit breaks the SQL
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.page_size) || 20,
        })
        return JsonResponse(res, 200, result)
    } catch (error) {
        return HotelError(res, error, 'Error listing hotel bookings')
    }
}

export const adminSingleHotelBooking = async (req, res) => {
    try {
        return JsonResponse(res, 200, await getBooking(req.params.id, { admin: true }))
    } catch (error) {
        return HotelError(res, error, 'Error retrieving hotel booking')
    }
}

export const adminCancelHotelBooking = async (req, res) => {
    try {
        const booking = await cancelHotelBooking(req.params.id, { reason: req.body?.reason })
        await db.Notifies.create({ userId: req.user.id, title: 'Hotel booking cancelled', content: `Hotel booking ${booking.reference} at ${booking.hotel_name} was cancelled` })
        return JsonResponse(res, 200, { message: 'Booking cancelled with the hotel', data: booking })
    } catch (error) {
        return HotelError(res, error, 'Error cancelling hotel booking')
    }
}

export const adminRetryHotelBooking = async (req, res) => {
    try {
        const booking = await retryHotelBooking(req.params.id)
        return JsonResponse(res, 200, { message: `Booking ${booking.status === 'confirmed' ? 'confirmed' : `finished with status ${booking.status}`}`, data: booking })
    } catch (error) {
        return HotelError(res, error, 'Error retrying hotel booking')
    }
}

export const adminRefreshHotelBooking = async (req, res) => {
    try {
        const booking = await refreshOrderInfo(req.params.id)
        return JsonResponse(res, 200, { message: 'Booking refreshed from the supplier', data: booking })
    } catch (error) {
        return HotelError(res, error, 'Error refreshing hotel booking')
    }
}
