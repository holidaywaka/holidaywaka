import { body, param, query, validationResult } from "express-validator"
import dayjs from "dayjs"
import { ValidatorError } from "../../../config/utilities.js"
import { HotelSyncScopes } from "../../../database/models/hotelSyncLogModel.js"

// ETG search constraints: https://docs.emergingtravel.com/docs/b2b-api/hotel-search/search-by-region/
const MAX_DAYS_AHEAD = 730
const MAX_NIGHTS = 30
const MAX_ROOMS = 9
const MAX_ADULTS = 6
const MAX_CHILDREN = 4
const MAX_CHILD_AGE = 17
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/
const SORT_OPTIONS = ["price_asc", "price_desc", "stars_desc"]

const handleErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return ValidatorError(res, errors)
    }
    next()
}

const isStrictDate = (value) => DATE_FORMAT.test(value) && dayjs(value, "YYYY-MM-DD").format("YYYY-MM-DD") === value

const stayValidators = () => [
    body("checkin")
        .isString().withMessage("Check-in date is required")
        .bail()
        .custom((value) => {
            if (!isStrictDate(value)) throw new Error("Check-in date must be in YYYY-MM-DD format")
            const today = dayjs().startOf("day")
            const checkin = dayjs(value)
            if (checkin.isBefore(today)) throw new Error("Check-in date cannot be in the past")
            if (checkin.diff(today, "day") > MAX_DAYS_AHEAD) throw new Error(`Check-in date must be within ${MAX_DAYS_AHEAD} days`)
            return true
        }),
    body("checkout")
        .isString().withMessage("Check-out date is required")
        .bail()
        .custom((value, { req }) => {
            if (!isStrictDate(value)) throw new Error("Check-out date must be in YYYY-MM-DD format")
            const nights = dayjs(value).diff(dayjs(req.body.checkin), "day")
            if (nights < 1) throw new Error("Check-out must be after check-in")
            if (nights > MAX_NIGHTS) throw new Error(`A stay cannot be longer than ${MAX_NIGHTS} nights`)
            return true
        }),
    body("residency")
        .isString().withMessage("Guest nationality is required")
        .bail()
        .matches(/^[a-zA-Z]{2}$/).withMessage("Guest nationality must be a 2-letter country code"),
    // Visitor location (not the guest nationality): Nigerian viewers are priced in NGN, everyone else in USD
    body("viewer_country")
        .optional({ values: "null" })
        .matches(/^[a-zA-Z]{2,3}$/).withMessage("viewer_country must be a 2 or 3-letter country code"),
    body("guests")
        .isArray({ min: 1, max: MAX_ROOMS }).withMessage(`Between 1 and ${MAX_ROOMS} rooms can be searched`),
    body("guests.*.adults")
        .isInt({ min: 1, max: MAX_ADULTS }).withMessage(`Each room needs between 1 and ${MAX_ADULTS} adults`)
        .toInt(),
    body("guests.*.children")
        .optional()
        .isArray({ max: MAX_CHILDREN }).withMessage(`A room can have at most ${MAX_CHILDREN} children`),
    body("guests.*.children.*")
        .isInt({ min: 0, max: MAX_CHILD_AGE }).withMessage(`Children ages must be between 0 and ${MAX_CHILD_AGE}`)
        .toInt(),
]

export const hotelSearchValidator = () => [
    body("region_id")
        .isInt({ min: 1 }).withMessage("Please select a destination")
        .toInt(),
    ...stayValidators(),
    body("page").optional().isInt({ min: 1 }).toInt(),
    body("page_size").optional().isInt({ min: 1, max: 50 }).withMessage("page_size must be between 1 and 50").toInt(),
    body("sort").optional().isIn(SORT_OPTIONS).withMessage(`sort must be one of ${SORT_OPTIONS.join(", ")}`),
    body("filters").optional().isObject(),
    body("filters.name").optional().isString().isLength({ max: 100 }),
    body("filters.stars").optional().isArray(),
    body("filters.stars.*").isInt({ min: 0, max: 5 }).toInt(),
    body("filters.kinds").optional().isArray(),
    body("filters.kinds.*").isString(),
    body("filters.meals").optional().isArray(),
    body("filters.meals.*").isString(),
    body("filters.serp_filters").optional().isArray(),
    body("filters.serp_filters.*").isString(),
    body("filters.payment_types").optional().isArray(),
    body("filters.payment_types.*").isIn(["now", "hotel", "deposit"]),
    body("filters.free_cancellation").optional().isBoolean().toBoolean(),
    body("filters.price_min").optional().isFloat({ min: 0 }).toFloat(),
    body("filters.price_max").optional().isFloat({ min: 0 }).toFloat(),
    handleErrors,
]

export const hotelIdParamValidator = () => [
    param("hid").isInt({ min: 1 }).withMessage("Invalid hotel id").toInt(),
    handleErrors,
]

export const hotelRatesValidator = () => [
    param("hid").isInt({ min: 1 }).withMessage("Invalid hotel id").toInt(),
    ...stayValidators(),
    handleErrors,
]

export const hotelPrebookValidator = () => [
    body("hid").isInt({ min: 1 }).withMessage("Invalid hotel id").toInt(),
    ...stayValidators(),
    body("book_hash")
        .isString().withMessage("Please select a rate")
        .bail()
        .isLength({ min: 1, max: 256 }).withMessage("Invalid rate selected"),
    handleErrors,
]

export const prebookIdParamValidator = () => [
    param("id").isUUID().withMessage("Invalid reservation id"),
    handleErrors,
]

export const destinationQueryValidator = () => [
    query("q")
        .isString().withMessage("Search term is required")
        .bail()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Type at least 2 characters"),
    handleErrors,
]

export const popularDestinationsValidator = () => [
    query("country")
        .optional({ values: "falsy" })
        .matches(/^[a-zA-Z]{2}$/).withMessage("country must be a 2-letter ISO code"),
    handleErrors,
]

export const hotelSyncValidator = () => [
    body("scope").isIn(Object.values(HotelSyncScopes)).withMessage(`scope must be one of ${Object.values(HotelSyncScopes).join(", ")}`),
    body("countries").optional().isArray(),
    body("countries.*").isInt({ min: 1 }).toInt(),
    body("max_hotels").optional().isInt({ min: 1, max: 100000 }).toInt(),
    body("full_discovery").optional().isBoolean().toBoolean(),
    handleErrors,
]

const PAYMENT_METHODS = ["DIRECT_BANK_TRANSFER", "UNIFIED_PAYMENT_TRANSFER"]

export const hotelBookingValidator = () => [
    body("prebook_id").isUUID().withMessage("Please choose your room again"),
    body("contact.first_name").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Lead guest first name is required"),
    body("contact.last_name").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Lead guest last name is required"),
    body("contact.email").isEmail().withMessage("A valid email address is required").normalizeEmail({ gmail_remove_dots: false }),
    body("contact.phone").isString().trim().isLength({ min: 5, max: 35 }).withMessage("A valid phone number is required"),
    body("rooms").isArray({ min: 1, max: 9 }).withMessage("Guest details are required for every room"),
    body("rooms.*.adults").isArray({ min: 1, max: 6 }).withMessage("Each room needs at least one adult"),
    body("rooms.*.adults.*.first_name").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Every adult needs a first name"),
    body("rooms.*.adults.*.last_name").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Every adult needs a last name"),
    body("rooms.*.children").optional().isArray({ max: 4 }),
    body("comment").optional({ values: "falsy" }).isString().isLength({ max: 256 }).withMessage("Special requests can be up to 256 characters"),
    body("payment_method").isIn(PAYMENT_METHODS).withMessage("Select a payment method"),
    body("voucher_code").optional({ values: "falsy" }).isString().isLength({ max: 64 }),
    handleErrors,
]

export const bookingIdParamValidator = () => [
    param("id").isUUID().withMessage("Invalid booking id"),
    handleErrors,
]

export const adminBookingListValidator = () => [
    query("status").optional({ values: "falsy" }).isString(),
    query("search").optional({ values: "falsy" }).isString().isLength({ max: 100 }),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("page_size").optional().isInt({ min: 1, max: 100 }).toInt(),
    handleErrors,
]
