import express from "express"
import { AddBank, FetchBankInformation, UpdateBank } from "../controller/banks.controller.js"
import { bankValidator } from "../validator/banks.validator.js"
import { authenticate, authorized } from "../../../middleware/auth.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"

const route = express.Router()

route.get("", FetchBankInformation)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.post("", bankValidator(), AddBank)
route.post("/:id", IdParamsValidator(), UpdateBank)

export default route

