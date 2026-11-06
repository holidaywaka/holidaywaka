
import express from "express"
import { authenticate, authorized, includeAdminMiddleware } from "../../../middleware/auth.js"
import { GetAllNewsLetters, SaveNewsLetters } from "../controller/newsletters.controller.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { newsletterValidator } from "../validator/newsletters.validator.js"

const route = express.Router()

route.use(includeAdminMiddleware)

route.post("", newsletterValidator(), SaveNewsLetters)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("", GetAllNewsLetters)

export default route