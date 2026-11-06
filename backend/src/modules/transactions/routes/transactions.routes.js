import { USER_TYPES } from '../../../config/utilities.js'
import { GetAllTransactions, GetAllTransactionTimelines, UploadPaymentProof, GetSingleTransaction, UpPaymentWebhook, VerifySingleTransaction, UpdateTransactionPaymentStatus } from '../controller/transactions.controller.js'
import { sharedMiddleware, authenticate, authorized, includeAdminMiddleware } from '../../../middleware/auth.js'
import { IdParamsValidator } from '../../../validators/common.validator.js'
import { paymentProofValidator, paymentProofParamsValidator } from '../validator/transactions.validator.js'
import { paymentStatusValidator } from '../../trips/validator/trips.validator.js'

import express from 'express'
const route = express.Router()

// Gateway callbacks must not depend on the admin lookup middleware
route.post("/webhook", UpPaymentWebhook)

route.use(includeAdminMiddleware)


route.post("/upload-payment-proof", paymentProofValidator(), UploadPaymentProof)
route.get("/:id/:type", paymentProofParamsValidator(), GetSingleTransaction);
route.get("/verify/:id/:type", paymentProofParamsValidator(), VerifySingleTransaction);

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("/all", GetAllTransactions)
route.get("/timelines/:txid/all", GetAllTransactionTimelines)
route.put("/:id/payment-status", IdParamsValidator(), paymentStatusValidator(), UpdateTransactionPaymentStatus)

export default route
