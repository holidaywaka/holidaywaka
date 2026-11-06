
import express from "express"
import { authenticate, authorized } from "../../../middleware/auth.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { socialsValidator } from "../validator/socials.validator.js"
import { AddSocialLinks, AdminGetAllSocialLinks, DeleteSocialLink, GetAllSocialLinks, UpdateSocialLink } from "../controller/socials.controller.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"

const route = express.Router()

route.get("", GetAllSocialLinks)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))


route.get("/all", AdminGetAllSocialLinks)
route.post("", socialsValidator(), AddSocialLinks)
route.put("/:id", IdParamsValidator(), UpdateSocialLink)
route.delete("/:id", IdParamsValidator(), DeleteSocialLink)


export default route