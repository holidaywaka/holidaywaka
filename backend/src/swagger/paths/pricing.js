import { arr, jsonBody, num, object, ok, op, paginationParams, pathParam, queryParam, ref, str } from "../helpers.js"

// Exchange rates and service markups used to price every product

const idParam = pathParam("id", "Record id", { type: "string", format: "uuid" })
const markupServices = ["AIRPORT TRANSFERS", "PACKAGE", "VISA", "HOTEL"]
const quotes = arr(object({ quote: str("Foreign currency", { example: "USD" }), value: num("NGN per 1 unit of `quote`", { example: 1450 }) }, ["quote", "value"]))

export default {
    "/rates": {
        get: op({ tag: "Rates", summary: "Active exchange rate", description: "Used to convert USD prices to NGN for viewers in Nigeria.", responses: { 200: ok("Active rate (empty object when none)", ref("Rate")) } }),
        post: op({ tag: "Rates", admin: true, summary: "Add an exchange rate", body: jsonBody({ quotes }, ["quotes"]), responses: { 201: ok("Created") } }),
    },
    "/rates/{id}": {
        put: op({ tag: "Rates", admin: true, summary: "Update an exchange rate", params: [idParam], body: jsonBody({ quotes, status: str(null, { enum: ["true", "false"] }) }) }),
        delete: op({ tag: "Rates", admin: true, summary: "Delete an exchange rate", params: [idParam] }),
    },

    "/markups": {
        get: op({
            tag: "Markups", summary: "List service markups",
            description: "`services` in the response lists the services a markup can be created for.",
            params: [...paginationParams, queryParam("status", "Filter by status", { type: "string", enum: ["true", "false"] })],
            responses: { 200: ok("Paginated markups", { allOf: [ref("Paginated"), { type: "object", properties: { services: arr(str(null, { enum: markupServices })) } }] }) },
        }),
        post: op({
            tag: "Markups", admin: true, summary: "Create a markup for a service",
            description: "One markup per service. Hotel prices are increased by `discountValue`% plus `vat`% of the supplier price.",
            body: jsonBody({
                tag: str("Service", { enum: markupServices }),
                discountType: str(null, { enum: ["PERCENTAGE", "FIXED"] }),
                discountValue: num("Markup value"),
                vat: num("VAT percentage"),
                status: str(null, { enum: ["true", "false"] }),
            }, ["tag", "discountType", "discountValue"]),
            responses: { 201: ok("Created") },
        }),
    },
    "/dashboard": {
        get: op({
            tag: "Dashboard", admin: true, summary: "Admin dashboard metrics",
            description: "KPIs with % change against the previous equal period, revenue and gross margin per business line (hotels, packages, visa, airport transfers), revenue/bookings time series, payment status and method, top packages, hotel inventory and recent transactions. Money is in NGN (USD charges converted with the rate stored on each transaction); revenue counts PAID transactions.",
            params: [queryParam("range", "Reporting period", { type: "string", enum: ["7d", "30d", "90d", "12m"], default: "30d" })],
            responses: { 200: ok("Dashboard metrics", ref("AnyObject")) },
        }),
    },
    "/dashboard/insights": {
        get: op({
            tag: "Dashboard", admin: true, summary: "Admin insights",
            description: "Revenue and gross margin trends per business line (hotels, packages, visa, airport transfers), conversion funnels, booking lead time, travel seasonality, request weekdays, demand by destination, customer insights, hotel prebook insights and generated takeaways. Margin is the markup share of what customers paid (VAT excluded); `margin_estimated` is true when some transactions predate markup recording and use the line's current markup.",
            params: [queryParam("range", "Reporting period", { type: "string", enum: ["7d", "30d", "90d", "12m"], default: "12m" })],
            responses: { 200: ok("Insights", ref("AnyObject")) },
        }),
    },
    "/markups/{id}": {
        put: op({
            tag: "Markups", admin: true, summary: "Update a markup's value, VAT, type or status", params: [idParam],
            body: jsonBody({ discountType: str(null, { enum: ["PERCENTAGE", "FIXED"] }), discountValue: num(), vat: num(), status: str(null, { enum: ["true", "false"] }) }),
        }),
        delete: op({ tag: "Markups", admin: true, summary: "Delete a markup", params: [idParam] }),
    },
}
