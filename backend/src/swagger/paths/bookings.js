import { anyObject, arr, bool, date, file, int, jsonBody, multipartBody, num, object, ok, op, paginationParams, pathParam, queryParam, ref, str } from "../helpers.js"

// Packages (trips), visas, vouchers and the payments that settle them

const idParam = pathParam("id", "Record id", { type: "string", format: "uuid" })
const statusParam = queryParam("status", "Filter by status", { type: "string", enum: ["true", "false"] })
const transactionTypes = ["TRIP", "VISA", "TRANSFER", "CHAUFFEUR"]
const transactionStatuses = ["PENDING", "PAID", "PART_PAID", "SUBMITTED", "Declined"]
const paymentMethods = ["DIRECT_BANK_TRANSFER", "UNIFIED_PAYMENT_TRANSFER"]

const tripFields = {
    title: str(),
    tripType: str("Trip type / category"),
    destinations: arr(str(), "Destination names"),
    prices: arr(anyObject("Price tier (e.g. per traveller type)")),
    itineraries: arr(anyObject("Day-by-day itinerary item")),
    inclusions: arr(str()),
    summary: str(),
    description: str("HTML description"),
    startDate: date(),
    endDate: date(),
    images: arr(file("Trip image")),
}

const transactionUpdate = jsonBody({
    id: str("Enquiry id", { format: "uuid" }),
    txid: str("Transaction reference (optional for visa enquiries without an invoice)"),
    status: str(null, { enum: transactionStatuses }),
    paid: num("Amount received (required for PART_PAID)"),
    datePaid: date(),
    reason: str("Decline reason, emailed to the customer"),
    amount: num("Visa enquiries without an invoice: agreed amount in NGN; creates the transaction"),
}, ["id", "status"])

export default {
    // ------------------------------------------------------------------ Trips (holiday packages)
    "/trips": {
        get: op({
            tag: "Trips", summary: "Published holiday packages",
            description: "Filters combine (AND). Only the unfiltered first pages are cached.",
            params: [
                ...paginationParams,
                queryParam("tripType", "PRIVATE or GROUP"),
                queryParam("country", "Destination country (exact)"),
                queryParam("city", "Destination city (exact)"),
                queryParam("startMonth", "Month the trip starts, e.g. July (startDate is accepted as an alias)"),
                queryParam("endMonth", "Month the trip ends (endDate alias)"),
                queryParam("minPrice", "Lowest per-person price at least (NGN)", { type: "number" }),
                queryParam("maxPrice", "Lowest per-person price at most (NGN)", { type: "number" }),
            ],
            responses: { 200: ok("Paginated trips", ref("Paginated")) },
        }),
    },
    "/trips/single/{id}/{code}": {
        get: op({
            tag: "Trips", summary: "Single package priced for the viewer",
            params: [idParam, pathParam("code", "Viewer country or currency code; NG/NGN shows naira prices")],
            responses: { 200: ok("Trip", ref("AnyObject")) },
        }),
    },
    "/trips/enquiry/single/{id}": {
        get: op({ tag: "Trips", summary: "Trip enquiry details for payment", params: [idParam], responses: { 200: ok("Enquiry", ref("AnyObject")) } }),
    },
    "/trips/quote": {
        post: op({
            tag: "Trips", summary: "Price breakdown for a package order (same maths as the order)",
            description: "Prices come from the package's price list by `priceType`. A private trip with one adult always uses the solo / single price.",
            body: jsonBody({
                tripId: str(null, { format: "uuid" }),
                travelers: arr(object({ tag: str("e.g. Adult No.1"), priceType: str("Price type from the package") })),
                currency: str("Viewer currency code"),
                voucher_code: str(),
            }, ["tripId", "travelers"]),
            responses: { 200: ok("Quote", object({ currency: str(), subtotal: num(), fees: num("Markup + VAT"), total: num(), discount: num(), payable: num(), voucher: anyObject(), earliest_travel_date: date() })) },
        }),
    },
    "/trips/enquiry": {
        post: op({
            tag: "Trips", summary: "Book a package",
            description: "The server prices every traveller from the package (client amounts are ignored), applies markup/VAT and the voucher, checks the visa lead time (visa processing working days + 1 day) and emails the customer and admin.",
            body: jsonBody({
                tripId: str(null, { format: "uuid" }),
                tripType: str(),
                travelDate: date("Ignored for GROUP trips (they travel on the start date)"),
                travelers: arr(anyObject("Traveller: tag, priceType, firstName, lastName, email, phone, phoneCode, gender")),
                message: str(),
                currency: str("Viewer currency code"),
                payment_method: str(null, { enum: paymentMethods }),
                voucher_code: str(),
            }, ["tripId", "tripType", "travelDate", "travelers"]),
            responses: { 201: ok("Enquiry created", object({ message: str(), attachment: str("Query string for the upload-payment page"), url: str("Unified Payment checkout URL (card payments)", { nullable: true }) })) },
        }),
    },
    "/trips/destinations/all": {
        get: op({ tag: "Trips", summary: "Destinations that have packages", responses: { 200: ok("Destinations", ref("AnyObject")) } }),
    },
    "/trips/all": {
        get: op({ tag: "Trips", admin: true, summary: "All packages (admin)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated trips", ref("Paginated")) } }),
    },
    "/trips/create": {
        post: op({
            tag: "Trips", admin: true, summary: "Create a package",
            description: "Array fields are sent as JSON strings in the multipart form.",
            body: multipartBody(tripFields, ["title", "tripType", "destinations", "prices", "itineraries", "inclusions", "summary", "description", "startDate", "endDate"]),
            responses: { 201: ok("Created") },
        }),
    },
    "/trips/update/{id}": {
        put: op({ tag: "Trips", admin: true, summary: "Update a package", params: [idParam], body: multipartBody(tripFields) }),
    },
    "/trips/delete-media/{id}": {
        post: op({ tag: "Trips", admin: true, summary: "Remove an image from a package", params: [idParam], body: jsonBody({ url: str("Image URL to remove") }, ["url"]) }),
    },
    "/trips/delete/{id}": {
        delete: op({ tag: "Trips", admin: true, summary: "Delete a package", params: [idParam] }),
    },
    "/trips/enquiry-all": {
        get: op({ tag: "Trips", admin: true, summary: "All package enquiries", params: paginationParams, responses: { 200: ok("Paginated enquiries", ref("Paginated")) } }),
    },
    "/trips/enquiry/update": {
        put: op({ tag: "Trips", admin: true, summary: "Update enquiry status", body: jsonBody({ id: str(null, { format: "uuid" }), status: str() }, ["id", "status"]) }),
    },
    "/trips/enquiry/update-transaction": {
        put: op({ tag: "Trips", admin: true, summary: "Record a payment against a package enquiry", body: transactionUpdate }),
    },

    // ------------------------------------------------------------------ Visa
    "/visa/enquiry/create": {
        post: op({
            tag: "Visa", summary: "Submit a visa application / enquiry",
            body: jsonBody({
                firstName: str(), lastName: str(), email: str(null, { format: "email" }), phone: str(),
                nationality: str("Destination country"),
                travelDate: date(),
                hasPassport: bool(),
                currency: str("ISO 4217 currency code"),
                visa: object({
                    paymentType: str(null, { enum: ["appointment", "fullPayment", "enquiry"] }),
                    amount: num(),
                    payment_method: str(null, { enum: paymentMethods }),
                }),
            }, ["firstName", "lastName", "email", "phone", "nationality", "travelDate", "hasPassport", "currency", "visa"]),
            responses: { 201: ok("Enquiry created", ref("AnyObject")) },
        }),
    },
    "/visa/visa-country/all": {
        get: op({ tag: "Visa", summary: "Visa countries offered", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated countries", ref("Paginated")) } }),
    },
    "/visa/enquiry/all": {
        get: op({ tag: "Visa", admin: true, summary: "All visa enquiries", params: paginationParams, responses: { 200: ok("Paginated enquiries", ref("Paginated")) } }),
    },
    "/visa/all": {
        get: op({ tag: "Visa", admin: true, summary: "All visa countries (admin)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated countries", ref("Paginated")) } }),
    },
    "/visa/enquiry/update": {
        put: op({ tag: "Visa", admin: true, summary: "Update visa enquiry status", body: jsonBody({ id: str(null, { format: "uuid" }), status: str(null, { enum: ["Pending", "Approved", "Rejected"] }) }, ["id", "status"]) }),
    },
    "/visa/visa-country/create": {
        post: op({
            tag: "Visa", admin: true, summary: "Add a visa country",
            body: jsonBody({ country: str(), fee: num("Appointment fee"), destinations: arr(anyObject("Visa type with pricing")) }, ["country", "fee", "destinations"]),
            responses: { 201: ok("Created") },
        }),
    },
    "/visa/visa-country/update/{id}": {
        put: op({ tag: "Visa", admin: true, summary: "Update a visa country", params: [idParam], body: jsonBody({ country: str(), fee: num(), destinations: arr(anyObject()), status: str(null, { enum: ["true", "false"] }) }) }),
    },
    "/visa/visa-country/{id}": {
        delete: op({ tag: "Visa", admin: true, summary: "Delete a visa country", params: [idParam] }),
    },
    "/visa/enquiry/update-transaction": {
        put: op({ tag: "Visa", admin: true, summary: "Record a payment against a visa enquiry", body: transactionUpdate }),
    },

    // ------------------------------------------------------------------ Vouchers
    "/voucher/preview": {
        post: op({
            tag: "Vouchers", summary: "Check a voucher code at checkout",
            description: "Validates the code and prices the discount without reserving it. The order endpoints re-check and reserve it; a declined payment releases it.",
            body: jsonBody({ code: str(), service: str(null, { enum: ["ALL", "TRIP", "VISA", "HOTEL", "TRANSFER", "CHAUFFEUR"] }), amount: num("Order total"), currency: str("NGN or USD"), rate: num("NGN per USD, for fixed (NGN) vouchers on USD totals") }, ["code", "service", "amount"]),
            responses: { 200: ok("Discount", object({ code: str(), discount_type: str(), discount_value: num(), discount: num(), payable: num(), currency: str() })) },
        }),
    },
    "/voucher/all": {
        get: op({ tag: "Vouchers", admin: true, summary: "List vouchers", params: paginationParams, responses: { 200: ok("Paginated vouchers", ref("Paginated")) } }),
    },
    "/voucher/create": {
        post: op({
            tag: "Vouchers", admin: true, summary: "Create a voucher",
            body: jsonBody({
                code: str("Stored in upper case"),
                discountType: str(null, { enum: ["PERCENTAGE", "FIXED"] }),
                discountValue: num("Percent (<= 100) or NGN amount"),
                expirationDate: date(),
                maxUsageCount: int("0 = unlimited"),
                service: str(null, { enum: ["ALL", "TRIP", "VISA", "HOTEL", "TRANSFER", "CHAUFFEUR"] }),
                account: str("Optional customer email", { format: "email" }),
            }, ["code", "discountType", "discountValue", "expirationDate", "maxUsageCount", "service"]),
        }),
    },
    "/voucher/update/{id}": {
        put: op({ tag: "Vouchers", admin: true, summary: "Update a voucher", params: [idParam], body: jsonBody({ discountType: str(), discountValue: num(), expirationDate: date(), maxUsageCount: int(), service: str(null, { enum: ["ALL", "TRIP", "VISA", "HOTEL", "TRANSFER", "CHAUFFEUR"] }), status: str(null, { enum: ["true", "false"] }), account: str(null, { format: "email" }) }) }),
    },
    "/voucher/{id}/logs": {
        get: op({ tag: "Vouchers", admin: true, summary: "Usage history of a voucher", params: [idParam], responses: { 200: ok("Usage", ref("AnyObject")) } }),
    },
    "/voucher/{id}": {
        get: op({ tag: "Vouchers", admin: true, summary: "Voucher by code", params: [pathParam("id", "Voucher code")], responses: { 200: ok("Voucher", ref("AnyObject")) } }),
        delete: op({ tag: "Vouchers", admin: true, summary: "Delete a voucher", params: [idParam] }),
    },
    // ------------------------------------------------------------------ Transactions
    "/transactions/upload-payment-proof": {
        post: op({
            tag: "Transactions", summary: "Upload a bank-transfer payment slip",
            body: multipartBody({ transaction_id: str(null, { format: "uuid" }), transaction_type: str(null, { enum: transactionTypes }), image: file("Payment slip screenshot") }, ["transaction_id", "transaction_type", "image"]),
        }),
    },
    "/transactions/{id}/{type}": {
        get: op({ tag: "Transactions", summary: "Single transaction", params: [idParam, pathParam("type", "Transaction type", { type: "string", enum: transactionTypes })], responses: { 200: ok("Transaction", ref("AnyObject")) } }),
    },
    "/transactions/verify/{id}/{type}": {
        get: op({ tag: "Transactions", summary: "Verify a card payment with the payment provider", params: [idParam, pathParam("type", "Transaction type", { type: "string", enum: transactionTypes })], responses: { 200: ok("Verification result", ref("AnyObject")) } }),
    },
    "/transactions/webhook": {
        post: op({
            tag: "Transactions", summary: "Unified Payment webhook",
            description: "Payloft callbackUrl. Authenticated by `x-api-key` = secret key or `x-payloft-signature` = HMAC-SHA512 of the raw body with the secret key. Matched by `Token`, then `Order Id`, then `merchantRefData` (flat or inside `data`). The body only triggers a status check: the payment state is always read back from `gettransactionstatus/{token}` before anything changes. 200 = processed or unknown order (no retry); 401 = bad signature; 502 = gateway unreachable (retry).",
            body: jsonBody({ event: str(), data: anyObject("Gateway payload") }),
            responses: { 200: ok("Processed"), 401: ok("Invalid signature"), 502: ok("Retry later") },
        }),
    },
    "/transactions/{id}/payment-status": {
        put: op({
            tag: "Transactions", admin: true, summary: "Set a transaction's payment status (any service)",
            description: "PAID confirms the order, emails a receipt and, for hotels, starts the booking with the supplier. Declined emails the customer the reason and releases any voucher. PART_PAID records an instalment (closing the transaction when the balance reaches zero).",
            params: [idParam],
            body: jsonBody({ status: str(null, { enum: transactionStatuses }), paid: num("Required for PART_PAID"), datePaid: date(), reason: str("Decline reason") }, ["status"]),
            responses: { 200: ok("Updated", ref("AnyObject")) },
        }),
    },
    "/transactions/all": {
        get: op({ tag: "Transactions", admin: true, summary: "All transactions", params: paginationParams, responses: { 200: ok("Paginated transactions", ref("Paginated")) } }),
    },
    "/transactions/timelines/{txid}/all": {
        get: op({ tag: "Transactions", admin: true, summary: "Timeline of a transaction", params: [pathParam("txid", "Transaction id")], responses: { 200: ok("Timeline entries", ref("AnyObject")) } }),
    },
    "/up/payment": {
        post: op({ tag: "Transactions", summary: "Create a test card payment (development only)", body: jsonBody({ amount: num(), currency: str("ISO 4217 code") }, ["amount", "currency"]) }),
    },
}
