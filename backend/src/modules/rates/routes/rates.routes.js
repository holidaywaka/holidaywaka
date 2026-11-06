import express from "express"
import { AddRate, DeleteRate, GetAllRates, UpdateRate } from "../controller/rates.controller.js"
import { authenticate, authorized } from "../../../middleware/auth.js"
import { USER_TYPES } from "../../../config/utilities.js"
import { createRateValidator, updateRateValidator } from "../validator/rates.validator.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"

const route = express.Router()

route.get("", GetAllRates)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.post("", createRateValidator(), AddRate)
route.put("/:id", IdParamsValidator(), updateRateValidator(), UpdateRate)
route.delete("/:id", IdParamsValidator(), DeleteRate)

export default route