import { GetListsTransferNodes, FindPlaces, FindPlaceByID, TransferOfferPricing, ChauffeurServicePrice, CreateTripOrder, GetAllTransferOrders, GetTransferInvoice, CheckCancellation, CancelIwayOrder, GetOrderPaymentLink, VerifyOrderPayment, ResyncOrder, UpdateTransferTransaction, CheckBookableTime } from "../controller/transfers.controller.js"
import { includeAdminMiddleware } from "../../../middleware/auth.js"
import { transferPriceOfferValidator, chauffeurpriceValidator, checkOrderCancellationValidator, transferTransactionStatusValidator, checkTimeValidator } from "../validator/transfers.validator.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"
import express from "express"

const route = express.Router()

route.use(includeAdminMiddleware);


route.get("/transport-nodes", GetListsTransferNodes)
route.get("/find-place", FindPlaces)
route.get("/find-place/:id", FindPlaceByID)
route.post("/check-time", checkTimeValidator(), CheckBookableTime)
route.post("/transfer-offer-pricing", transferPriceOfferValidator(), TransferOfferPricing)
route.post("/chauffeur-offer-pricing", chauffeurpriceValidator(), ChauffeurServicePrice)
route.post("/check-cancellation", checkOrderCancellationValidator(), CheckCancellation)
route.post("/order-cancellation", checkOrderCancellationValidator(), CancelIwayOrder)
route.post("/payment-link", checkOrderCancellationValidator(), GetOrderPaymentLink)
route.post("/verify-order", checkOrderCancellationValidator(), VerifyOrderPayment)
route.post("/create-order", CreateTripOrder)
route.get("/all-orders", GetAllTransferOrders)
route.get("/transfer-invoice/:id", IdParamsValidator(), GetTransferInvoice)
route.get("/resync-order/:id", IdParamsValidator(), ResyncOrder)
route.put("/update-payment", transferTransactionStatusValidator(), UpdateTransferTransaction)


export default route