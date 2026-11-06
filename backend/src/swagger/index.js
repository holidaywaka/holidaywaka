import swaggerUi from "swagger-ui-express"
import { isProduction } from "../config/dbConfig.js"
import { arr, int, object, str } from "./helpers.js"
import userPaths from "./paths/users.js"
import contentPaths from "./paths/content.js"
import pricingPaths from "./paths/pricing.js"
import bookingPaths from "./paths/bookings.js"
import transferPaths from "./paths/transfers.js"
import hotelPaths, { hotelSchemas } from "./paths/hotels.js"

/**
 * OpenAPI 3 description of every /api endpoint. Path files mirror each module's routes/<module>.routes.js -
 * update them together when adding or changing an endpoint.
 */
export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Holidaywaka API",
        version: "1.0.0",
        description: "Hotels, holiday packages, visas, airport transfers and payments.\n\nAdmin endpoints (padlock) need the `access_token` cookie set by `POST /users/login`: sign in through the login endpoint first, then call them from this page on the same origin.",
    },
    servers: [{ url: "/api" }],
    tags: [
        { name: "Hotels", description: "Hotel search, rates and prebook (RateHawk / ETG)" },
        { name: "Hotels admin", description: "Static content sync with ETG" },
        { name: "Trips", description: "Holiday packages" },
        { name: "Visa" },
        { name: "Transfers", description: "Airport transfers and chauffeur (iWay)" },
        { name: "Transactions", description: "Payments and payment proofs" },
        { name: "Vouchers" },
        { name: "Dashboard", description: "Admin metrics" },
        { name: "Rates", description: "USD to NGN exchange rate" },
        { name: "Markups", description: "Per-service markup and VAT" },
        { name: "Users", description: "Authentication and admin account" },
        { name: "Bank" }, { name: "Contacts" }, { name: "Newsletters" }, { name: "Socials" }, { name: "Blogs" }, { name: "Docs", description: "Legal documents" },
    ],
    paths: {
        ...hotelPaths,
        ...bookingPaths,
        ...transferPaths,
        ...pricingPaths,
        ...userPaths,
        ...contentPaths,
    },
    components: {
        securitySchemes: {
            cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" },
        },
        schemas: {
            Message: object({ message: str() }),
            ValidationError: object({ status: str(null, { example: "error" }), message: str(null, { example: "[field]: reason, [other]: reason" }) }),
            ServerError: object({ status: str(null, { example: "failed" }), message: str(), stack: str() }),
            AnyObject: { type: "object", additionalProperties: true },
            Counts: { type: "object", additionalProperties: { type: "integer" }, description: "value -> number of hotels" },
            Paginated: object({
                total: int(), totalPages: int(), p: int(), page_size: int(), nextPage: int(), prevPage: int(),
                message: str(), data: arr({ type: "object", additionalProperties: true }),
            }),
            Rate: object({
                id: str(null, { format: "uuid" }), source: str(), status: str(),
                quotes: arr(object({ quote: str(null, { example: "USD" }), value: str("NGN per 1 unit", { example: "1450" }) })),
            }),
            ...hotelSchemas,
        },
    },
}

// Public in development; elsewhere only when explicitly enabled, as it maps the admin surface
export function mountSwagger(app) {
    if (isProduction && process.env.SWAGGER_ENABLED !== "true") return false
    app.get("/api-docs.json", (req, res) => res.json(openApiSpec))
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
        customSiteTitle: "Holidaywaka API docs",
        swaggerOptions: { withCredentials: true, persistAuthorization: true },
    }))
    return true
}
