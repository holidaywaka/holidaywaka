import { body, validationResult } from "express-validator"
import { ValidatorError, VoucherServiceOptions } from "../../../config/utilities.js"

export const createVoucherValidator = () => {
    return [
        body("code")
            .notEmpty()
            .withMessage("Code is required"),
        body("discountType")
            .notEmpty()
            .withMessage("Discount type is required")
            .custom(value => ["PERCENTAGE", "FIXED"].includes(String(value).toUpperCase()))
            .withMessage("Discount type must be PERCENTAGE or FIXED"),
        body("discountValue")
            .isFloat({ gt: 0 })
            .withMessage("Discount value must be greater than zero")
            .custom((value, { req }) => String(req.body.discountType).toUpperCase() !== "PERCENTAGE" || Number(value) <= 100)
            .withMessage("A percentage discount cannot exceed 100"),
        body("expirationDate")
            .notEmpty()
            .withMessage("Expiration date is required")
            .custom(value => new Date(value).getTime() >= Date.now())
            .withMessage("Expiration date must be a future date"),
        body("maxUsageCount")
            .isInt({ min: 0 })
            .withMessage("Maximum usage count is required (0 = unlimited)"),
        body("service")
            .notEmpty()
            .withMessage("Service is required")
            .custom(value => VoucherServiceOptions.includes(value))
            .withMessage("Invalid service option, expected one of: " + VoucherServiceOptions.join(", ")),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const applyVoucherValidator = () => {
    return [
        body("code")
            .notEmpty()
            .withMessage("Code is required"),
        body("service")
            .notEmpty()
            .withMessage("Service is required")
            .custom(value => VoucherServiceOptions.includes(value))
            .withMessage("Invalid service option, expected one of: " + VoucherServiceOptions.join(", ")),
        body("amount")
            .notEmpty()
            .withMessage("Original amount is required"),
        body("email")
            .notEmpty()
            .withMessage("Recipient email is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const disconnectVoucherValidator = () => {
    return [
        body("code")
            .notEmpty()
            .withMessage("Code is required"),
        body("service")
            .notEmpty()
            .withMessage("Service is required")
            .custom(value => VoucherServiceOptions.includes(value))
            .withMessage("Invalid service option, expected one of: " + VoucherServiceOptions.join(", ")),
        body("email")
            .notEmpty()
            .withMessage("Recipient email is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}



export const previewVoucherValidator = () => {
    return [
        body("code").trim().notEmpty().withMessage("Enter a voucher code"),
        body("service")
            .custom(value => VoucherServiceOptions.includes(value))
            .withMessage("Invalid service option, expected one of: " + VoucherServiceOptions.join(", ")),
        body("amount").isFloat({ gt: 0 }).withMessage("Amount is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}
