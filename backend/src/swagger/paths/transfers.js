import { anyObject, arr, jsonBody, num, ok, op, paginationParams, pathParam, queryParam, ref, str } from "../helpers.js"

// Airport transfers and chauffeur services (iWay)

const tag = "Transfers"
const idParam = pathParam("id", "Record id", { type: "string", format: "uuid" })
const orderBody = jsonBody({ order_id: str("iWay order id") }, ["order_id"])

export default {
    "/v4/transport-nodes": {
        get: op({ tag, summary: "Search airports / stations", params: [queryParam("term", "Search term", { type: "string" }, true)], responses: { 200: ok("Transport nodes", ref("AnyObject")) } }),
    },
    "/v4/find-place": {
        get: op({ tag, summary: "Search places (addresses, hotels, landmarks)", params: [queryParam("term", "Search term", { type: "string" }, true)], responses: { 200: ok("Places", ref("AnyObject")) } }),
    },
    "/v4/find-place/{id}": {
        get: op({ tag, summary: "Place details", params: [pathParam("id", "Place id")], responses: { 200: ok("Place", ref("AnyObject")) } }),
    },
    "/v4/check-time": {
        post: op({ tag, summary: "Check whether a pickup time is bookable", body: jsonBody({ price_id: str(), pickup_time: str("Pickup date-time") }, ["price_id", "pickup_time"]) }),
    },
    "/v4/transfer-offer-pricing": {
        post: op({
            tag, summary: "Transfer offers between two points",
            description: "Prices include the AIRPORT TRANSFERS markup; `charge` is in NGN for Nigerian viewers.",
            body: jsonBody({ start_lat: num(), start_lon: num(), finish_lat: num(), finish_lon: num(), currency: str("Viewer currency code") }, ["start_lat", "start_lon", "finish_lat", "finish_lon"]),
            responses: { 200: ok("Offers", arr(ref("AnyObject"))) },
        }),
    },
    "/v4/chauffeur-offer-pricing": {
        post: op({
            tag, summary: "Chauffeur (hourly) offers",
            body: jsonBody({ start_lat: num(), start_lon: num(), place_id: str(), currency: str("Viewer currency code") }, ["start_lat", "start_lon", "place_id"]),
            responses: { 200: ok("Offers", arr(ref("AnyObject"))) },
        }),
    },
    "/v4/check-cancellation": {
        post: op({ tag, summary: "Cancellation terms for an order", body: orderBody }),
    },
    "/v4/order-cancellation": {
        post: op({ tag, summary: "Cancel an order", body: orderBody }),
    },
    "/v4/payment-link": {
        post: op({ tag, summary: "Payment link for an order", body: orderBody }),
    },
    "/v4/verify-order": {
        post: op({ tag, summary: "Verify payment for an order", body: orderBody }),
    },
    "/v4/create-order": {
        post: op({
            tag, summary: "Book a transfer / chauffeur",
            body: jsonBody({
                currency: str("Viewer currency code"),
                pickup_type: str("TRANSFER or CHAUFFEUR"),
                payment_method: str(null, { enum: ["DIRECT_BANK_TRANSFER", "UNIFIED_PAYMENT_TRANSFER"] }),
                trip: arr(anyObject("iWay trip: price id, passengers, pickup time, addresses...")),
            }, ["currency", "pickup_type", "trip"]),
            responses: { 201: ok("Order created", ref("AnyObject")) },
        }),
    },
    "/v4/all-orders": {
        get: op({ tag, summary: "Transfer orders", params: paginationParams, responses: { 200: ok("Paginated orders", ref("Paginated")) } }),
    },
    "/v4/transfer-invoice/{id}": {
        get: op({ tag, summary: "Invoice of a transfer order", params: [idParam], responses: { 200: ok("Invoice", ref("AnyObject")) } }),
    },
    "/v4/resync-order/{id}": {
        get: op({ tag, summary: "Refresh an order from iWay", params: [idParam], responses: { 200: ok("Order", ref("AnyObject")) } }),
    },
    "/v4/update-payment": {
        put: op({
            tag, summary: "Update the payment status of a transfer",
            body: jsonBody({ transactionID: str(), transferID: str(), paymentStatus: str(null, { enum: ["PENDING", "PAID", "PART_PAID", "SUBMITTED", "Declined"] }) }, ["transactionID", "transferID", "paymentStatus"]),
        }),
    },
}
