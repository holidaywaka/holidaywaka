import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const newsletterValidator = () => {
    return [
        body("email")
            ?.trim()
            .notEmpty()
            .withMessage("Email address is required")
            .isEmail()
            .withMessage("Provide a valid email address"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
