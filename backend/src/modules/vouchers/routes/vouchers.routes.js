import { USER_TYPES } from '../../../config/utilities.js'
import { CreateVoucher, UpdateVoucher, GetAllVouchers, GetVoucherByCode, RemoveVoucherInfo, PreviewVoucher, GetVoucherLogs } from '../controller/vouchers.controller.js'
import { authenticate, authorized } from '../../../middleware/auth.js'
import { IdParamsValidator } from '../../../validators/common.validator.js'
import { createVoucherValidator, previewVoucherValidator } from '../validator/vouchers.validator.js'
import express from "express"

const route = express.Router()

// Public: checkout only learns whether a code applies and how much it saves
route.post("/preview", previewVoucherValidator(), PreviewVoucher)

// Admin: codes are never listed publicly
route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("/all", GetAllVouchers)
route.post("/create", createVoucherValidator(), CreateVoucher)
route.put("/update/:id", IdParamsValidator(), UpdateVoucher)
route.delete("/:id", IdParamsValidator(), RemoveVoucherInfo)
route.get("/:id/logs", IdParamsValidator(), GetVoucherLogs)
route.get("/:id", IdParamsValidator(), GetVoucherByCode)

export default route
