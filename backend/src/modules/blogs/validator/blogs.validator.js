import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"


export const createBlogValidator = () => {
    return [
        body("title")
        
        .notEmpty()
        .withMessage("Title is required"),
        body("read")
        
        .notEmpty()
        .withMessage("provide an estimated read time for this article"),
        body("content")
        
        .notEmpty()
        .withMessage("Content is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const blogIDValidator = () => {
    return [
        body("id")
        
        .notEmpty()
        .withMessage("Blog is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}