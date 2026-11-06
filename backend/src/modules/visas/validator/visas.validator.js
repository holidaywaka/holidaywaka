import { body, validationResult } from "express-validator"
import { ValidatorError } from "../../../config/utilities.js"
import currencyCode from "../../../config/currencyCode.js";
import CustomError from "../../../middleware/custom-error.js";




export const visaenquiryValidator = () => {
    return [
        body("firstName")
            ?.trim().notEmpty()
            .withMessage("First name is required"),
        body("currency")
            ?.trim().notEmpty()
            .withMessage("Currency is required")
            .bail()
            .custom((value) => {
                const exists = currencyCode.find(c => c.code === value)
                if(!exists) throw new CustomError(400, 'invalid currency provided')
                return true;
            }),
        body("lastName")
            ?.trim().notEmpty()
            .withMessage("Last Name is required"),
        body("email")
            ?.trim().notEmpty()
            .withMessage("Email address is required")
            .isEmail()
            .withMessage("Provide a valid Email address"),
        body("phone")
            ?.trim().notEmpty()
            .withMessage("Phone Number is required"),
        body("nationality")
            ?.trim().notEmpty()
            .withMessage("Destination country is required"),
        body("travelDate")
            ?.trim().notEmpty()
            .withMessage("Expected travel date is required"),
        body("hasPassport")
            ?.trim().notEmpty()
            .withMessage("Kindly confirm if you have a passport already"),
        body("visa")
            .notEmpty()
            .withMessage("Kindly select a valid visa type"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const updateVisaEnquiryValidator = () => {
    return [
        body("id")
            ?.trim().notEmpty()
            .withMessage("Enquiry ID is required"),
        body("status")
            ?.trim().notEmpty()
            .withMessage("Status is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}

export const createVisaCountryValidator = () => {
    return [
        body("country")
            .notEmpty()
            .withMessage("Visa Country is required"),
        body("fee")
            .notEmpty()
            .withMessage("Appointment fee is required"),
        body("destinations")
            .isArray({ min: 1 })
            .withMessage("Visa destination type(s) must be an array with at least one item")
            .bail()
            .custom((value) => value.length > 0)
            .withMessage("Visa destination type(s) is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
