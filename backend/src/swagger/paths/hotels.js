import { arr, bool, date, int, jsonBody, num, object, ok, op, pathParam, queryParam, ref, str } from "../helpers.js"

// Hotels (RateHawk / ETG). Static content is served from our database; search, hotelpage and prebook are live.

const tag = "Hotels"
const adminTag = "Hotels admin"
const hidParam = pathParam("hid", "ETG hotel id", { type: "integer", minimum: 1 })

const stayFields = {
    checkin: date("Today or later, at most 730 days ahead"),
    checkout: date("1 to 30 nights after check-in"),
    residency: str("Guest nationality, ISO 3166-1 alpha-2", { example: "ng" }),
    guests: arr(ref("HotelGuestRoom"), "One entry per room (1-9 rooms)"),
    viewer_country: str("Visitor's country from IP geolocation. NG shows prices in NGN; anything else (or omitted) shows USD.", { example: "NG", nullable: true }),
}
const stayRequired = ["checkin", "checkout", "residency", "guests"]

export default {
    "/hotels/destinations": {
        get: op({
            tag, summary: "Destination autocomplete (regions and hotels)",
            params: [queryParam("q", "At least 2 characters", { type: "string", minLength: 2, maxLength: 100 }, true)],
            responses: { 200: ok("Matching regions and hotels", ref("HotelDestinations")) },
        }),
    },
    "/hotels/destinations/popular": {
        get: op({
            tag, summary: "Suggested destinations before the visitor types",
            description: "Regions and top-rated hotels in the visitor's country; falls back to the most stocked destinations overall (`scope: global`) when we hold none there.",
            params: [queryParam("country", "Visitor country, ISO 3166-1 alpha-2", { type: "string", example: "NG" })],
            responses: { 200: ok("Suggestions", { allOf: [ref("HotelDestinations"), object({ scope: str(null, { enum: ["country", "global"] }), country_code: str(null, { nullable: true }) })] }) },
        }),
    },
    "/hotels/filters": {
        get: op({ tag, summary: "Labels for filter values (amenities, meals, taxes...)", responses: { 200: ok("Filter reference data", ref("HotelFilterReference")) } }),
    },
    "/hotels/search": {
        post: op({
            tag, summary: "Search hotels in a region (live availability)",
            description: "Rates are fetched live from ETG and cached for 10 minutes per stay. Filtering, sorting and paging run on the cached result. Send only the fields in use: page defaults to 1, page_size to 20, sort to price_asc and no filters. Facet counts in `filters` are computed against every other active filter group. Prices include the HOTEL markup and VAT, in the viewer's currency.",
            body: jsonBody({
                region_id: int("Region id from /hotels/destinations"),
                ...stayFields,
                page: int(null, { minimum: 1 }),
                page_size: int(null, { minimum: 1, maximum: 50 }),
                sort: str(null, { enum: ["price_asc", "price_desc", "stars_desc"] }),
                filters: ref("HotelSearchFilters"),
            }, ["region_id", ...stayRequired]),
            responses: { 200: ok("Search results", ref("HotelSearchResponse")), 502: ok("Supplier unavailable", ref("HotelError")) },
        }),
    },
    "/hotels/{hid}": {
        get: op({ tag, summary: "Hotel details (static content)", params: [hidParam], responses: { 200: ok("Hotel", ref("HotelDetails")) } }),
    },
    "/hotels/{hid}/rates": {
        post: op({
            tag, summary: "All available rates for a hotel (ETG hotelpage)",
            description: "Call only once the guest has chosen a hotel. Cached for 30 minutes per hotel and stay.",
            params: [hidParam],
            body: jsonBody(stayFields, stayRequired),
            responses: { 200: ok("Rates, cheapest first", ref("HotelRatesResponse")), 502: ok("Supplier unavailable", ref("HotelError")) },
        }),
    },
    "/hotels/prebook": {
        post: op({
            tag, summary: "Prebook a rate (confirm availability and price)",
            description: "`book_hash` must come from /hotels/{hid}/rates for the same hotel and stay within the last 30 minutes. If the price changed (within the configured increase limit), `price_changed` is true and the guest must accept the new price before booking.",
            body: jsonBody({ hid: int(), ...stayFields, book_hash: str("Rate `book_hash` from /hotels/{hid}/rates") }, ["hid", ...stayRequired, "book_hash"]),
            responses: {
                201: ok("Prebook stored", ref("HotelPrebook")),
                409: ok("Rate expired or sold out (`rate_expired`, `rate_not_found`, `no_available_rates`)", ref("HotelError")),
                502: ok("Supplier unavailable", ref("HotelError")),
            },
        }),
    },
    "/hotels/prebook/{id}": {
        get: op({
            tag, summary: "Stored prebook",
            params: [pathParam("id", "Prebook id", { type: "string", format: "uuid" })],
            responses: { 200: ok("Prebook", { allOf: [ref("HotelPrebook"), object({ is_expired: bool() })] }) },
        }),
    },
    "/hotels/bookings": {
        post: op({
            tag, summary: "Create a hotel booking from a prebook and start payment",
            description: "Step 4 starts only after payment: the booking is created as `awaiting_payment`; card payments return a Unified Payment URL, bank transfers are confirmed by an admin. Once paid, the ETG booking form -> finish -> status flow runs in the background (deposit payment type). All adult names are required; children's names are optional (their ages come from the search).",
            body: jsonBody({
                prebook_id: str(null, { format: "uuid" }),
                contact: object({ first_name: str(), last_name: str(), email: str(null, { format: "email" }), phone: str("5-35 characters, with country code") }, ["first_name", "last_name", "email", "phone"]),
                rooms: arr(object({ adults: arr(object({ first_name: str(), last_name: str() })), children: arr(object({ first_name: str(), last_name: str() })) }), "One entry per searched room"),
                comment: str("Special request, up to 256 characters"),
                payment_method: str(null, { enum: ["DIRECT_BANK_TRANSFER", "UNIFIED_PAYMENT_TRANSFER"] }),
                voucher_code: str(),
            }, ["prebook_id", "contact", "rooms", "payment_method"]),
            responses: {
                201: ok("Booking created", object({ booking: ref("HotelBooking"), transaction: ref("AnyObject"), url: str("Card payment URL", { nullable: true }), attachment: str("Upload-payment query string") })),
                409: ok("Prebook expired, or the room is already being booked", ref("HotelError")),
                422: ok("Guest details don't match the search, or the rate can't be paid online", ref("HotelError")),
            },
        }),
    },
    "/hotels/bookings/webhook": {
        post: op({
            tag, summary: "ETG receive-booking-status webhook",
            description: "Verified with HMAC-SHA256(API key, timestamp + token). `completed` confirms the booking; `failed` reads the reason from Check booking process. Answers 200 when processed.",
            body: jsonBody({ data: object({ partner_order_id: str(), status: str(null, { enum: ["completed", "failed"] }) }), signature: object({ signature: str(), timestamp: int(), token: str() }) }),
            responses: { 200: ok("Processed"), 401: ok("Invalid signature", ref("HotelError")) },
        }),
    },
    "/hotels/bookings/{id}": {
        get: op({ tag, summary: "Booking status for the customer", params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], responses: { 200: ok("Booking", ref("HotelBooking")) } }),
    },
    "/hotels/bookings/{id}/voucher": {
        get: op({
            tag, summary: "Download the ETG voucher (PDF) of a confirmed booking",
            params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })],
            responses: { 200: { description: "PDF voucher", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } }, 409: ok("Not confirmed yet, or the voucher is still being generated", ref("HotelError")) },
        }),
    },
    "/hotels/admin/bookings": {
        get: op({
            tag: adminTag, admin: true, summary: "Hotel bookings",
            params: [queryParam("status", "awaiting_payment | payment_declined | booking | confirmed | failed | needs_attention | cancelled"), queryParam("search", "Reference, hotel, guest, email or partner order id"), queryParam("page", "Page", { type: "integer", minimum: 1 }), queryParam("page_size", "Page size", { type: "integer", minimum: 1, maximum: 100 })],
            responses: { 200: ok("Bookings", object({ page: int(), page_size: int(), total: int(), total_pages: int(), status_counts: ref("AnyObject"), data: arr(ref("HotelBooking")) })) },
        }),
    },
    "/hotels/admin/bookings/{id}": {
        get: op({ tag: adminTag, admin: true, summary: "Booking with supplier details and timeline", params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], responses: { 200: ok("Booking", ref("HotelBooking")) } }),
    },
    "/hotels/admin/bookings/{id}/cancel": {
        post: op({
            tag: adminTag, admin: true, summary: "Cancel a confirmed booking with the hotel (ETG order/cancel)",
            description: "Stores the supplier's cancellation fee and refund and emails the guest. Retries once on timeout.",
            params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], body: jsonBody({ reason: str("Internal note") }),
            responses: { 200: ok("Cancelled", object({ message: str(), data: ref("HotelBooking") })), 409: ok("Not cancellable (order_not_cancellable, order_not_found, lock)", ref("HotelError")) },
        }),
    },
    "/hotels/admin/bookings/{id}/retry": {
        post: op({ tag: adminTag, admin: true, summary: "Retry the ETG booking of a paid booking that failed or needs attention", params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], responses: { 200: ok("Outcome", object({ message: str(), data: ref("HotelBooking") })) } }),
    },
    "/hotels/admin/bookings/{id}/refresh": {
        post: op({ tag: adminTag, admin: true, summary: "Refresh from ETG order info (hotel confirmation number, cancellation)", params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], responses: { 200: ok("Refreshed", object({ message: str(), data: ref("HotelBooking") })) } }),
    },
    "/hotels/admin/bookings/{id}/voucher": {
        get: op({ tag: adminTag, admin: true, summary: "Download the ETG voucher (PDF)", params: [pathParam("id", "Booking id", { type: "string", format: "uuid" })], responses: { 200: { description: "PDF voucher", content: { "application/pdf": { schema: { type: "string", format: "binary" } } } } } }),
    },
    "/hotels/admin/sync": {
        post: op({
            tag: adminTag, admin: true, summary: "Start a static content sync",
            description: "Runs in the background. Only one sync runs at a time (409 if one is already running).",
            body: jsonBody({
                scope: str("static: filter values + hotel static data; ids: discover new/updated hotels; content: fetch pending hotel content; full: all", { enum: ["static", "ids", "content", "full"] }),
                countries: arr(int(), "ETG country ids (defaults to RATEHAWK_SYNC_COUNTRIES)"),
                max_hotels: int("Content step cap for this run"),
                full_discovery: bool("Ignore updated_since and rediscover every hotel"),
            }, ["scope"]),
            responses: { 202: ok("Sync started", object({ message: str(), data: ref("HotelSyncLog") })), 409: ok("A sync is already running", object({ message: str(), data: ref("HotelSyncLog") })) },
        }),
        get: op({
            tag: adminTag, admin: true, summary: "Recent sync runs and content totals",
            responses: { 200: ok("Sync logs", object({ data: arr(ref("HotelSyncLog")), totals: object({ pending: int(), synced: int(), regions: int() }) })) },
        }),
    },
    "/hotels/admin/overview": {
        get: op({ tag: adminTag, admin: true, summary: "ETG endpoint access and rate limits for our API key", responses: { 200: ok("ETG overview", ref("AnyObject")) } }),
    },
}

export const hotelSchemas = {
    HotelBooking: object({
        id: str(null, { format: "uuid" }),
        reference: str("e.g. HW-AB12CD34"),
        status: str(null, { enum: ["awaiting_payment", "payment_declined", "booking", "confirmed", "failed", "needs_attention", "cancelled"] }),
        failure_reason: str(null, { nullable: true }),
        hotel_name: str(), checkin: date(), checkout: date(), nights: int(),
        guests: arr(ref("HotelGuestRoom")),
        rooms: arr(object({ guests: arr(object({ first_name: str(), last_name: str(), is_child: bool(), age: int() })) })),
        room_name: str(), meal: str(), free_cancellation_before: str(null, { format: "date-time", nullable: true }),
        amount: num(), discount: num(), currency: str(),
        hotel_confirmation_number: str(null, { nullable: true }),
        has_voucher: bool(),
        transaction: ref("AnyObject"),
    }),
    HotelError: object({ message: str(), code: str("Machine-readable error code") }),
    HotelGuestRoom: object({ adults: int(null, { minimum: 1, maximum: 6 }), children: arr(int(null, { minimum: 0, maximum: 17 }), "Child ages, at most 4") }, ["adults"]),
    HotelSearchFilters: object({
        name: str("Hotel name contains"),
        stars: arr(int(null, { minimum: 0, maximum: 5 })),
        kinds: arr(str(), "Accommodation kinds, e.g. hotel, apartment"),
        meals: arr(str(null, { enum: ["no_meal", "breakfast", "half_board", "full_board", "all_inclusive", "other"] })),
        serp_filters: arr(str(), "Amenities; hotels must have all of them"),
        payment_types: arr(str(null, { enum: ["now", "hotel", "deposit"] })),
        free_cancellation: bool(),
        price_min: num("In the viewer's currency"),
        price_max: num("In the viewer's currency"),
    }),
    HotelRegion: object({ id: int(), name: str(), type: str(), country_code: str() }),
    HotelDestinations: object({
        regions: arr(object({ id: int(), name: str(), type: str(), country_code: str(), hotels_count: int() })),
        hotels: arr(object({ hid: int(), name: str(), address: str(), star_rating: int(), region_id: int(), region_name: str(), country_code: str() })),
    }),
    HotelFilterReference: object({
        serp_filters: arr(object({ value: str(), desc: str() })),
        kinds: arr(str()),
        star_ratings: arr(int()),
        meals: arr(object({ value: str(), desc: str() })),
        room_amenities: arr(object({ value: str(), desc: str() })),
        taxes: arr(object({ value: str(), desc: str() })),
    }),
    HotelStay: object({
        checkin: date(), checkout: date(), residency: str(), currency: str("Currency of all selling prices (NGN or USD)"),
        guests: arr(ref("HotelGuestRoom")), nights: int(), rooms: int(), total_guests: int(),
    }),
    HotelPayment: object({
        type: str(null, { enum: ["now", "hotel", "deposit"] }),
        amount: num("Selling price"), currency: str(),
        show_amount: num("Selling price"), show_currency: str(),
        free_cancellation_before: str("UTC", { format: "date-time", nullable: true }),
        cancellation_policies: arr(object({ start_at: str(null, { nullable: true }), end_at: str(null, { nullable: true }), amount_show: num("Penalty in the selling currency") })),
        taxes: arr(object({ name: str(), amount: num(), currency: str(), included_by_supplier: bool("false: paid by the guest at the hotel, in `currency`") })),
        vat: object({ included: bool(), applied: bool(), amount: num(), currency: str() }),
    }),
    HotelRate: object({
        book_hash: str("Pass to /hotels/prebook"),
        room_name: str(),
        room: object({ main_name: str(), bedding_type: str(), bathroom: str(), misc_room_type: str() }),
        meal: object({ value: str(), category: str(), has_breakfast: bool(), no_child_meal: bool() }),
        amenities: arr(str()),
        daily_prices: arr(num()),
        allotment: int("Rooms left at this rate"),
        payment: ref("HotelPayment"),
        payment_types: arr(ref("HotelPayment")),
        deposit: object({ amount: num(), currency: str(), is_refundable: bool() }, [], "Paid at the hotel, in the hotel's currency"),
        no_show: object({ amount: num(), currency: str(), from_time: str() }),
    }),
    HotelSearchHotel: object({
        hid: int(), name: str(), kind: str(), star_rating: int(), address: str(), latitude: num(), longitude: num(),
        images: arr(str("URL template; replace {size}, e.g. 640x400")),
        serp_filters: arr(str()), min_price: num(), currency: str(),
        meals: arr(str()), has_free_cancellation: bool(), payment_types: arr(str()), rates_count: int(),
    }),
    HotelSearchResponse: object({
        search: { allOf: [ref("HotelStay"), object({ region: ref("HotelRegion") })] },
        total_hotels: int("Hotels ETG returned"), total_available: int("With local content"), total_filtered: int(),
        page: int(), page_size: int(), total_pages: int(),
        filters: object({ stars: ref("Counts"), kinds: ref("Counts"), meals: ref("Counts"), serp_filters: ref("Counts"), payment_types: ref("Counts"), free_cancellation: int(), price: object({ min: num(), max: num() }) }, [], "Facet counts: each option counts the results it yields with the other selected filters applied. Selected options are always listed. The price range spans all available hotels."),
        hotels: arr(ref("HotelSearchHotel")),
        expires_at: str(null, { format: "date-time" }),
    }),
    HotelRatesResponse: object({ hid: int(), search: ref("HotelStay"), rates: arr(ref("HotelRate")), fetched_at: str(null, { format: "date-time" }), expires_at: str(null, { format: "date-time" }) }),
    HotelDetails: object({
        hid: int(), name: str(), kind: str(), star_rating: int(), hotel_chain: str(), address: str(), postal_code: str(), latitude: num(), longitude: num(),
        region: ref("HotelRegion"), check_in_time: str(), check_in_time_end: str(), check_out_time: str(), is_closed: bool(),
        images: arr(object({ url: str(), category_slug: str() })),
        amenity_groups: arr(object({ group_name: str(), amenities: arr(str()), non_free_amenities: arr(str()) })),
        description_struct: arr(object({ title: str(), paragraphs: arr(str()) })),
        metapolicy_struct: ref("AnyObject"),
        metapolicy_extra_info: str("HTML; must be shown to the guest"),
        policy_struct: arr(object({ title: str(), paragraphs: arr(str("May contain HTML")) })), payment_methods: arr(str(), "e.g. visa, mastercard, cash"),
        room_groups: arr(ref("AnyObject")), serp_filters: arr(str()), facts: ref("AnyObject"),
    }),
    HotelPrebook: object({
        id: str(null, { format: "uuid" }), hid: int(), hotel_name: str(), book_hash: str("Use for booking"),
        price_changed: bool(), original_amount: num(), amount: num(), currency: str(),
        checkin: date(), checkout: date(), residency: str(), guests: arr(ref("HotelGuestRoom")),
        rate: ref("HotelRate"), expires_at: str(null, { format: "date-time" }), created_at: str(null, { format: "date-time" }),
    }),
    HotelSyncLog: object({ id: str(), scope: str(), status: str(null, { enum: ["running", "success", "failed"] }), params: ref("AnyObject"), stats: ref("AnyObject"), error: str(), startedAt: str(), finishedAt: str() }),
}
