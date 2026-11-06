import { body, validationResult } from "express-validator"
import { ValidatorError, verificationTags } from "../../../config/utilities.js"
import CustomError from "../../../middleware/custom-error.js"
import db from "../repository/users.repository.js"


export const validateAdminSignup = () => {
    return [
        body("firstName")
            ?.trim().notEmpty()
            .withMessage("First name is required"),
        body("lastName")
            ?.trim().notEmpty()
            .withMessage("Last name is required"),
        body("email")
            ?.trim().notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email format"),
        body("password")
            .notEmpty()
            .withMessage("Password is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const validateLogin = () => {
    return [
        body("email")
            ?.trim().notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email format"),
        body("password")
            .notEmpty()
            .withMessage("Password is required"),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export const passwordValidator = () => {
    return [
        body("currentPassword")
            .notEmpty()
            .withMessage("Current Password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is required")
            .bail()
            .custom((value, { req }) => {
                if (value === req.body.currentPassword) throw new CustomError(400, 'Cannot re-use the same password twice in a row')
                return true;
            }),
        body("confirmPassword")
            .notEmpty()
            .withMessage("New Password confirmation is required")
            .bail()
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) throw new CustomError(400, 'passwords do not match')
                return true;
            }),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return ValidatorError(res, errors)
            }
            next()
        }
    ]
}


export function approveEmailValidator() {
    return [
        body("tag")
            .notEmpty().withMessage(`Verification tag is required`)
            .bail()
            .custom(value => {
                if (!Object.values(verificationTags).includes(value)) throw new CustomError(400, `Verification tag must either be "${verificationTags.registration}" / "${verificationTags.forgot_password}"`);

                return true;
            }),
        body("email")
            .notEmpty().withMessage("Email address is required"),
        body("otp")
            .notEmpty().withMessage("Verification code is required")
            .bail()
            .custom(async (value, { req }) => {
                const exists = await db.Users.findOne({ where: {otp: value, email: req.body.email} })
                if (!exists) throw new CustomError(404, `Invalid OTP / Email provided`);
                return true;
            }),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return formatValidatorError(res, errors.array())
            next()
        }
    ]
}


export function forgotPasswordValidator() {
    return [
        body("email")
            .notEmpty().withMessage("Email address is required")
            .bail()
            .custom(async (value) => {
                const exists = await db.Users.findOne({ where: { email: value } })
                if (!exists) throw new CustomError(404, "Account not found with the email provided");

                return true;
            }),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return formatValidatorError(res, errors.array())
            next()
        }
    ]
}


export function resetPasswordValidator() {
    return [
        body("password")
            .notEmpty().withMessage("New Password is required"),
        body("confirmPassword")
            .notEmpty().withMessage("Password confirmation is required")
            .custom((value, { req }) => {
                if (value !== req.body.password) throw new CustomError(400, `Passwords do not match`);

                return true;
            }),
        body("email")
            .notEmpty().withMessage("Email address is required")
            .bail()
            .custom(async (value) => {
                const exists = await db.Users.findOne({ where: { email: value } })
                if (!exists) throw new CustomError(404, "Account not found with the email provided");

                return true;
            }),
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return formatValidatorError(res, errors.array())
            next()
        }
    ]
}
