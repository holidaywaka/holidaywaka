
import express from "express"
import { GetAllContactEnquiries, SubmitContactEnquiry } from "../controller/contacts.controller.js"
import { authenticate, authorized, includeAdminMiddleware } from "../../../middleware/auth.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { contactValidator } from "../validator/contacts.validator.js"

const route = express.Router()

route.use(includeAdminMiddleware)

route.post("", contactValidator(), SubmitContactEnquiry)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("", GetAllContactEnquiries)

export default route
