import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"




export const transferPriceOfferValidator = () => {
    return [
        body("start_lat")
            .notEmpty()
            .withMessage("Start place latitude is required"),
        body("start_lon")
            .notEmpty()
            .withMessage("Start place lontitude is required"),
        body("finish_lat")
            .notEmpty()
            .withMessage("Finish place latitude is required"),
        body("finish_lon")
            .notEmpty()
            .withMessage("Finish place lontitude is required"),
        body("currency")
            .notEmpty()
            .withMessage("Country's currency abbreviation is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const checkTimeValidator = () => {
    return [
        body("price_id")
            .notEmpty()
            .withMessage("Price ID is required"),
        body("pickup_time")
            .notEmpty()
            .withMessage("Pickup time is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const chauffeurpriceValidator = () => {
    return [
        body("start_lat")
            .notEmpty()
            .withMessage("Start place latitude is required"),
        body("start_lon")
            .notEmpty()
            .withMessage("Start place lontitude is required"),
        body("place_id")
            .notEmpty()
            .withMessage("Place ID is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const checkOrderCancellationValidator = () => {
    return [
        body("order_id")
            .notEmpty()
            .withMessage("Order ID is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const transferTransactionStatusValidator = () => {
    return [
        body("transactionID")
            .notEmpty()
            .withMessage("Transaction ID is required"),
        body("transferID")
            .notEmpty()
            .withMessage("Transfer ID is required"),
        body("paymentStatus")
            .notEmpty()
            .withMessage("Payment status is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
