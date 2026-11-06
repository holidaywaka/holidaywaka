
import express from "express"
import { authenticate, authorized } from "../../../middleware/auth.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { markupValidator } from "../validator/markups.validator.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"
import { CreateMarkup, DeleteMarkup, GetAllMarkups, UpdateMarkup } from "../controller/markups.controller.js"

const route = express.Router()

route.get("", GetAllMarkups)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.post("", markupValidator(), CreateMarkup)
route.put("/:id", IdParamsValidator(), UpdateMarkup)
route.delete("/:id", IdParamsValidator(), DeleteMarkup)


export default route