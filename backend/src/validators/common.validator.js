import { param, validationResult } from "express-validator"
import { ValidatorError } from "../config/utilities.js"


export const IdParamsValidator = () => {
    return [
        param("id")
            ?.trim()
            .notEmpty()
            .withMessage("ID is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
