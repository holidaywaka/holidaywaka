
import { body, param, validationResult } from 'express-validator'
import { ValidatorError, validateDateFormat, ServerTransactionStatusOptions, safeParse } from '../../../config/utilities.js'
import CustomError from '../../../middleware/custom-error.js';

export const UpdatetripValidate = () => [
    (req, res, next) => {
        try {
            const fields = req.body.data;
            req.body = safeParse(fields)
            next()
        } catch (error) {
            next(new CustomError(400, "Invalid JSON data provided"))
        }
    },
]

export const tripValidate = () => [
    (req, res, next) => {
        try {
            const fields = req.body.data;
            req.body = safeParse(fields)
            next()
        } catch (error) {
            next(new CustomError(400, "Invalid JSON data provided"))
        }
    },
    body("destinations")
        .isArray({ min: 1 }).withMessage("At least one destination is required"),
    body("title")
        ?.trim().notEmpty().withMessage("Title is required"),
    body("prices")
        .isArray({ min: 1 }).withMessage("At least one pricing is required"),
    body("itineraries")
        .isArray({ min: 1 }).withMessage("At least one itinerary is required"),
    body("inclusions")
        .isArray({ min: 1 }).withMessage("At least one inclusion is required"),
    body("summary")
        ?.trim().notEmpty().withMessage("Trip summary is required"),
    body("description")
        ?.trim().notEmpty()
        .withMessage("Trip description is connected to"),
    body("startDate")
        ?.trim().notEmpty()
        .withMessage("Start date is connected to"),
    body("endDate")
        ?.trim().notEmpty()
        .withMessage("End date is connected to"),
    body("tripType")
        ?.trim().notEmpty()
        .withMessage("Trip type is connected to"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return ValidatorError(res, errors);
        }
        next();
    }
]


export const validateDeleteTripMdedia = () => {
    return [
        param("id")
            ?.trim().notEmpty()
            .withMessage("Trip ID is required"),
        body("url")
            ?.trim().notEmpty()
            .withMessage("Image URL is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]

}

export const validateSingleTrip = () => {
    return [
        param("id")
            ?.trim().notEmpty()
            .withMessage("Trip ID is required"),
        param("code")
            ?.trim().notEmpty()
            .withMessage("Code is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]

}


export const tripEnquiryValidate = () => {
    return [
        body("travelers")
            .isArray({ min: 1 })
            .withMessage("Traveler(s) is required"),
        body("tripType")
            ?.trim().notEmpty()
            .withMessage("Trip tag is required"),
        body("travelDate")
            ?.trim().notEmpty()
            .withMessage("Travel Date is required")
            .custom((val) => validateDateFormat(val))
            .withMessage("Invalid travel date provided"),
        body("tripId")
            ?.trim().notEmpty()
            .withMessage("Specify the Trip this enquiry is connected to"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]

}

export const enuqiryStatusValidate = () => {
    return [
        body("id")
            .notEmpty()
            .withMessage("Enquiry ID is required"),
        body("status")
            ?.trim()
            .notEmpty()
            .withMessage("Enquiry Status is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const enuqiryTransactionStatusValidate = () => {
    return [
        body("id")
            .notEmpty()
            .withMessage("Enquiry ID is required"),
        body("txid").optional({ values: "falsy" }).isString(),
        body("amount").optional({ values: "falsy" }).isFloat({ gt: 0 }).withMessage("Amount must be greater than zero"),
        body("reason").optional({ values: "falsy" }).isString().isLength({ max: 500 }),
        body("status")
            ?.trim()
            .notEmpty()
            .withMessage("Enquiry Status is required")
            .custom(val => Object.values(ServerTransactionStatusOptions).includes(val))
            .withMessage('Invalid Status Type provided'),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
export const paymentStatusValidator = () => {
    return [
        body("status")
            .isIn(Object.values(ServerTransactionStatusOptions))
            .withMessage(`Status must be one of ${Object.values(ServerTransactionStatusOptions).join(", ")}`),
        body("paid")
            .if(body("status").equals(ServerTransactionStatusOptions.part_paid))
            .isFloat({ gt: 0 })
            .withMessage("Amount paid is required"),
        body("datePaid")
            .if(body("status").equals(ServerTransactionStatusOptions.part_paid))
            .notEmpty()
            .withMessage("Date of payment is required"),
        body("reason").optional({ values: "falsy" }).isString().isLength({ max: 500 }),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
