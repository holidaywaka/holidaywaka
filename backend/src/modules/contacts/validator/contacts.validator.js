import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const contactValidator = () => {
    return [
        body("name")
            ?.trim()
            .notEmpty()
            .withMessage("Full name is required"),
        body("contact")
            ?.trim()
            .notEmpty()
            .withMessage("Contact info is required"),
        body("message")
            ?.trim()
            .notEmpty()
            .withMessage("Provide a valid reason for making an enquiry"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
