import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const socialsValidator = () => {
    return [
        body("link")
            ?.trim()
            .notEmpty()
            .withMessage("Social Link is required"),
        body("tag")
            ?.trim()
            .notEmpty()
            .withMessage("Social Tag is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
