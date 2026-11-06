import { USER_TYPES } from '../../../config/utilities.js'
import { GetUser, Login, ManagePassword, MyNotifications, AddAdminAccount, ApproveEmail, ForgotPassword, ResendOtp, ResetPassword, Logout } from '../controller/users.controller.js'
import { authenticate, authorized, includeAdminMiddleware } from '../../../middleware/auth.js'
import { validateLogin, passwordValidator, validateAdminSignup, approveEmailValidator, forgotPasswordValidator, resetPasswordValidator } from '../validator/users.validator.js'
import express from 'express'

const route = express.Router()

route.post("/add-admin", validateAdminSignup(), AddAdminAccount)

route.use(includeAdminMiddleware)
route.post("/login", validateLogin(), Login);
route.post("/verify-email", approveEmailValidator(), ApproveEmail)
route.post("/forgot-password", forgotPasswordValidator(), ForgotPassword)
route.post("/resend", forgotPasswordValidator(), ResendOtp)
route.post("/reset-password", resetPasswordValidator(), ResetPassword)

route.use(authenticate)
route.use(authorized(Object.values(USER_TYPES)))

route.get("/", GetUser)
route.post("/logout", Logout)
route.get("/notifications", MyNotifications)
route.put("/password", passwordValidator(), ManagePassword)

export default route
