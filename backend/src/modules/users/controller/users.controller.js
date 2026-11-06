import { ServerError, JsonResponse, PageOffset, ServerPagination, hashPassword, USER_TYPES, MainStatusOptions, validatePassword, verificationTags, LOCAL_CORS, getCookieOptions } from "../../../config/utilities.js"
import jwt from "jsonwebtoken"
import cookie from "cookie"
import dayjs from "dayjs"
import { JOB_FILES, runJobs } from "../../../config/jobs-utils.js"
import db from "../repository/users.repository.js"
import { Op } from "sequelize"
import otpgen from "otp-generator"
import { cookieName } from "../../../middleware/auth.js"

export const GetUser = async (req, res) => {
    try {
        const users = await db.Users.findOne({ where: { id: req.user.id }, attributes: ['email', 'firstName', 'lastName'] })
        return JsonResponse(res, 200, { message: "Users data fetched", data: users })
    } catch (error) {
        ServerError(res, error)
    }
}

export const AddAdminAccount = async (req, res) => {
    try {
        const password = await hashPassword(req.body.password)
        const user = await db.Users.create({
            ...req.body,
            role: USER_TYPES.admin,
            emailVerified: MainStatusOptions.true,
            password
        })

        return JsonResponse(res, 200, { message: `Admin created successfully` })
    } catch (error) {
        ServerError(res, error)
    }
}

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await db.Users.findOne({ where: { email } })
        if (!user) return JsonResponse(res, 404, { message: 'Account not found' })

        const isPassword = await validatePassword(req.body.password, user.password)
        if (!isPassword) return JsonResponse(res, 404, { message: `Invalid password` })

        // if bcrypt hash the new password
        if (user.password.startsWith("$2")) {
            const hashJobName = `HASH-PASSWORD-${user.email}`
            runJobs(hashJobName, JOB_FILES.hash_password, {
                body: {
                    password: req.body.password,
                    id: user.id
                }
            })
        }


        const contentMessage = `Attempt to login into your account at exactly ${dayjs().format("DD MMMM YYYY hh:mm A")}`
        await db.Notifies.create({
            userId: req.admin.id,
            title: 'Login Alert',
            content: contentMessage
        })

        // const jobName = `Email-${user.id}_${user.firstName}__${new Date().getTime()}`
        // runJobs(`Email-${jobName}`, JOB_FILES.email, {
        //     body: [
        //         {
        //             fullname: `${user.firstName}`,
        //             mailTo: user.email,
        //             subject: `Login Alert`,
        //             template: "notis",
        //             message: contentMessage,
        //             content: [
        //                 {
        //                     label: "Email Address", value: user.email
        //                 }
        //             ]
        //         }
        //     ]
        // })
        const details = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie(cookieName, token, {
            ...getCookieOptions(),
            maxAge: 1000 * 60 * 60 * 12 // 12 hours
        })

        return JsonResponse(res, 200, { message: 'Logged in successfully', data: details })
    } catch (error) {
        ServerError(res, error)
    }
}

export const Logout = async (req, res) => {
    try {
        const options = getCookieOptions();
        res.clearCookie(cookieName, options);

        return JsonResponse(res, 200, {message: 'Logged out successfully'})
    } catch (error) {
        return ServerError(res, error, 'Error logging out')
    }
}

export const ManagePassword = async (req, res) => {
    try {
        const item = await db.Users.findOne({ where: { id: req.user.id } })
        const isValid = await validatePassword(req.body.currentPassword, item.password)
        if (!isValid) return JsonResponse(res, 404, { message: "Incorrect password provided" })

        const password = await hashPassword(req.body.newPassword)
        await item.update({ password })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Password Change Alert',
            content: `Attempt to change your account password at exactly ${dayjs().format("DD MMMM YYYY hh:mm A")}`
        })

        return JsonResponse(res, 200, { message: 'Password updated successfully' })

    } catch (error) {
        ServerError(res, error, 'error changing password')
    }
}


export const MyNotifications = async (req, res) => {
    try {
        const { p, page_size, search } = req.query

        let where = {
            userId: req.user.id
        }
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Notifies.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `notifications successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}


export const ApproveEmail = async (req, res) => {
    try {
        const user = await db.Users.findOne({ where: { email: req.body.email } })
        if (dayjs().isAfter(user.otpExpiry)) return JsonResponse(res, 400, { message: `Verification code has expired` })
        await user.update({
            otp: req.body.tag === verificationTags.registration ? null : req.body.otp,
            emailVerified: MainStatusOptions.true
        })

        return JsonResponse(res, 200, { message: 'Email address successfully verified' })
    } catch (error) {
        return ServerError(res, error);
    }
}

export const ResendOtp = async (req, res) => {
    try {

        const user = await db.Users.findOne({ where: { email: req.body.email } })
        const otp = otpgen.generate(6, { specialChars: false, lowerCaseAlphabets: false })

        const otpExpiry = dayjs().add(10, "minute").toDate()
        await user.update({
            otp: otp,
            otpExpiry: otpExpiry
        })

        const jobName = `${user.id}__${Date.now()}`
        runJobs(jobName, JOB_FILES.notify, {
            body: [
                {
                    userId: user.id,
                    title: `Resend - Verification`,
                    content: `A request to resend verification code has been sent to your account, kindly affirm you authorized this request.`
                }
            ]
        })

        const jobEmail = `Email-${user.id}_${user.firstName}__${new Date().getTime()}`
        runJobs(`Email-${jobEmail}`, JOB_FILES.email, {
            body: [
                {
                    fullname: `${user.firstName}`,
                    mailTo: user.email,
                    subject: `Resend - Account Verification Code`,
                    template: "notis",
                    message: otp,
                    content: [
                        {
                            label: "Email Address", value: user.email
                        }
                    ]
                }
            ]
        })

        return JsonResponse(res, 200, { message: `Your verification code has been sent to ${req.body.email?.slice(0, 3)}*******${req.body.email?.slice(-10)}` })
    } catch (error) {
        return ServerError(res, error);
    }
}

export const ForgotPassword = async (req, res) => {
    try {
        const user = await db.Users.findOne({ where: { email: req.body.email } })
        const otp = otpgen.generate(6, { specialChars: false, lowerCaseAlphabets: false })
        const otpExpiry = dayjs().add(10, "minute").toDate()
        await user.update({
            otp: otp,
            otpExpiry: otpExpiry
        })

        const jobName = `${user.id}__${Date.now()}`
        runJobs(jobName, JOB_FILES.notify, {
            body: [
                {
                    userId: user.id,
                    title: `Forgot Password Attempt`,
                    content: `A forgot password request has been sent to your account, kindly affirm you authorized this request.`
                }
            ]
        })

        const jobEmail = `Email-${user.id}_${user.firstName}__${new Date().getTime()}`
        runJobs(`Email-${jobEmail}`, JOB_FILES.email, {
            body: [
                {
                    fullname: `${user.firstName}`,
                    mailTo: user.email,
                    subject: `Account Verification Code`,
                    template: "notis",
                    message: otp,
                    content: [
                        {
                            label: "Email Address", value: user.email
                        }
                    ]
                }
            ]
        })

        return JsonResponse(res, 200, { message: `Your verification code has been sent to ${req.body.email?.slice(0, 3)}*******${req.body.email?.slice(-10)}` })
    } catch (error) {
        ServerError(res, error)
    }
}

export const ResetPassword = async (req, res) => {
    try {
        const user = await db.Users.findOne({ where: { email: req.body.email } })
        if (!user) JsonResponse(res, 404, { message: 'Invalid OTP provided' })
        if (dayjs().isAfter(user.otpExpiry)) return JsonResponse(res, 400, { message: `Verification code has expired` })
        const password = await hashPassword(req.body.password)

        await user.update({
            password,
            otp: null
        })

        const jobName = `${user.id}__${Date.now()}`
        runJobs(jobName, JOB_FILES.notify, {
            body: [
                {
                    userId: user.id,
                    title: `Password Reset`,
                    content: `Your password has been changed through a forgot password process, kindly ignore if you are aware of this`
                }
            ]
        })

        return JsonResponse(res, 200, { message: 'Password saved, kindly login with your new password' })
    } catch (error) {
        return ServerError(res, error);
    }
}