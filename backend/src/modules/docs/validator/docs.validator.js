import { body, param, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const docsTagValidator = () => {
    return [
        param("tag")
            ?.trim()
            .notEmpty()
            .withMessage("Tag is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const manageDocsValidator = () => {
    return [
        body("tag")
            ?.trim()
            .notEmpty()
            .withMessage("Tag is required"),
        body("content")
            ?.trim()
            .notEmpty()
            .withMessage("Content is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
