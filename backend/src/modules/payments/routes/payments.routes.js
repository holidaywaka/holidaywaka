import { TestPayment, TestPaymentStatus } from '../controller/payments.controller.js'
import { authenticate, authorized } from '../../../middleware/auth.js'
import { USER_TYPES } from '../../../config/utilities.js'

import express from 'express'
const route = express.Router()

// Gateway diagnostics: admin only, they create real gateway orders
route.use(authenticate)
route.use(authorized(USER_TYPES.admin))
route.post("/payment", TestPayment)
route.get("/payment/:token", TestPaymentStatus)

export default route
