import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const createRateValidator = () => {
    return [
        body("quotes")
            .isArray({min: 1})
            .withMessage("At least one quote is required"),
        body("quotes.*.quote")
            .notEmpty().withMessage("quote currency is required")
            .bail()
            .matches(/^[a-zA-Z]{3}$/).withMessage("quote currency must be a 3-letter code"),
        body("quotes.*.value")
            .notEmpty().withMessage("quote value is required")
            .bail()
            .isFloat({ gt: 0 }).withMessage("quote value must be a number greater than 0"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const updateRateValidator = () => {
    return [
        body("quotes")
            .optional()
            .isArray({min: 1})
            .withMessage("At least one quote is required"),
        body("quotes.*.quote")
            .notEmpty().withMessage("quote currency is required")
            .bail()
            .matches(/^[a-zA-Z]{3}$/).withMessage("quote currency must be a 3-letter code"),
        body("quotes.*.value")
            .notEmpty().withMessage("quote value is required")
            .bail()
            .isFloat({ gt: 0 }).withMessage("quote value must be a number greater than 0"),
        body("status")
            .optional()
            .isIn(["true", "false"]).withMessage("status must be \"true\" or \"false\""),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
