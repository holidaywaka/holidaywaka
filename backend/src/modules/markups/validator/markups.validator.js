import { body, validationResult } from "express-validator"
import { MarkupOptions, ValidatorError } from "../../../config/utilities.js"


export const markupValidator = () => {
    return [
        body("tag")
            ?.trim()
            .notEmpty()
            .withMessage("Tag is required")
            .custom(val => Object.values(MarkupOptions).includes(val))
            .withMessage("Invalid Markup Service provided"),
        body("discountType")
            ?.trim()
            .notEmpty()
            .withMessage("Discount type is required"),
        body("discountValue")
            ?.trim()
            .notEmpty()
            .withMessage("Discount value is required")
            .isNumeric().withMessage("Discount value must be a number"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
