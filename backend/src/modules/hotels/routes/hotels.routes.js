import { Router } from "express";
import { USER_TYPES } from "../../../config/utilities.js";
import {
    adminCancelHotelBooking,
    adminHotelBookings,
    adminRefreshHotelBooking,
    adminRetryHotelBooking,
    adminSingleHotelBooking,
    createHotelBooking,
    hotelBookingVoucher,
    hotelBookingWebhook,
    singleHotelBooking,
    hotelDestinations,
    hotelFilterReference,
    hotelPopularDestinations,
    hotelPageRates,
    hotelPrebook,
    hotelSyncLogs,
    retrieveB2BOverview,
    searchHotels,
    singleHotel,
    singlePrebook,
    startHotelSync,
} from "../controller/hotels.controller.js";
import { authenticate, authorized } from "../../../middleware/auth.js";
import {
    adminBookingListValidator,
    bookingIdParamValidator,
    hotelBookingValidator,
    destinationQueryValidator,
    hotelIdParamValidator,
    hotelPrebookValidator,
    hotelRatesValidator,
    hotelSearchValidator,
    hotelSyncValidator,
    popularDestinationsValidator,
    prebookIdParamValidator,
} from "../validator/hotels.validator.js";
const route = Router();

// ======================== static content - served from our database, never from ETG in real time ====================
route.get("/destinations", destinationQueryValidator(), hotelDestinations);
route.get("/destinations/popular", popularDestinationsValidator(), hotelPopularDestinations);
route.get("/filters", hotelFilterReference);

// ======================== step 2: search (live availability) ====================
route.post("/search", hotelSearchValidator(), searchHotels);

// ======================== step 3: prebook ====================
route.post("/prebook", hotelPrebookValidator(), hotelPrebook);
route.get("/prebook/:id", prebookIdParamValidator(), singlePrebook);

// ======================== step 4: booking (payment first, then ETG) ====================
route.post("/bookings", hotelBookingValidator(), createHotelBooking);
route.post("/bookings/webhook", hotelBookingWebhook);
route.get("/bookings/:id", bookingIdParamValidator(), singleHotelBooking);
route.get("/bookings/:id/voucher", bookingIdParamValidator(), hotelBookingVoucher);

// ======================== admin: bookings and post-booking (step 5) ====================
const admin = [authenticate, authorized(USER_TYPES.admin)];
route.get("/admin/bookings", admin, adminBookingListValidator(), adminHotelBookings);
route.get("/admin/bookings/:id", admin, bookingIdParamValidator(), adminSingleHotelBooking);
route.post("/admin/bookings/:id/cancel", admin, bookingIdParamValidator(), adminCancelHotelBooking);
route.post("/admin/bookings/:id/retry", admin, bookingIdParamValidator(), adminRetryHotelBooking);
route.post("/admin/bookings/:id/refresh", admin, bookingIdParamValidator(), adminRefreshHotelBooking);
route.get("/admin/bookings/:id/voucher", admin, bookingIdParamValidator(), hotelBookingVoucher);

// ======================== admin: step 1 content sync ====================
route.post("/admin/sync", authenticate, authorized(USER_TYPES.admin), hotelSyncValidator(), startHotelSync);
route.get("/admin/sync", authenticate, authorized(USER_TYPES.admin), hotelSyncLogs);
route.get("/admin/overview", authenticate, authorized(USER_TYPES.admin), retrieveB2BOverview);

// ======================== single hotel (keep param routes last) ====================
route.get("/:hid", hotelIdParamValidator(), singleHotel);
route.post("/:hid/rates", hotelRatesValidator(), hotelPageRates);

const hotelRoutes = route;
export default hotelRoutes;
