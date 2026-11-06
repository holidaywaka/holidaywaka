import { body, param, validationResult } from "express-validator"
import { ValidatorError, TransactionTypes } from "../../../config/utilities.js"


export const paymentProofValidator = () => {
    return [
        body("transaction_type")
            .notEmpty()
            .withMessage("Transaction type is required")
            .custom(value => Object.values(TransactionTypes).includes(value))
            .withMessage(`Invalid Transaction type!.`),
        body("transaction_id")
            .notEmpty()
            .withMessage("Transaction ID is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const paymentProofParamsValidator = () => {
    return [
        param("type")
            .notEmpty()
            .withMessage("Transaction type is required")
            .custom(value => Object.values(TransactionTypes).includes(value))
            .withMessage(`Invalid Transaction type!...`),
        param("id")
            .notEmpty()
            .withMessage("Transaction ID is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
