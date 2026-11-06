import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const bankValidator = () => {
    return [
        body("accountName")
            ?.trim()
            .notEmpty()
            .withMessage("Account Name is required"),
        body("accountNumber")
            ?.trim()
            .notEmpty()
            .withMessage("Account Number is required"),
        body("bankName")
            ?.trim()
            .notEmpty()
            .withMessage("Bank Name is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
