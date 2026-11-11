import { USER_TYPES } from '../../../config/utilities.js'
import { CreateNewTrips, UpdateTripInfo, UploadTripImages, DeleteTripMedia, DeleteTrip, GetAllTrips, GetSingleTrip, SaveTripEnquiries, GetAllTripEnquiries, UpdateEnquiryStatus, UpdateEnquiryTransaction, GetAllPackagesDestinations, AdminGetAllTrips, GetSingleTripForPayment, QuoteTrip} from '../controller/trips.controller.js'
import { sharedMiddleware, authenticate, authorized, includeAdminMiddleware } from '../../../middleware/auth.js'
import { tripValidate, tripEnquiryValidate, enuqiryStatusValidate, enuqiryTransactionStatusValidate, validateDeleteTripMdedia, validateSingleTrip, UpdatetripValidate } from '../validator/trips.validator.js'
import { IdParamsValidator } from '../../../validators/common.validator.js'
import express from "express"

const route = express.Router()


route.get("", GetAllTrips)
route.get("/single/:id/:code", validateSingleTrip(), GetSingleTrip)
route.get("/enquiry/single/:id", IdParamsValidator(), GetSingleTripForPayment)
route.post("/quote", QuoteTrip)
route.post("/enquiry", tripEnquiryValidate(), includeAdminMiddleware, SaveTripEnquiries)
route.get("/destinations/all", GetAllPackagesDestinations)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("/all", AdminGetAllTrips)
route.post("/create", tripValidate(), CreateNewTrips)
route.put("/update/:id", UpdatetripValidate(), IdParamsValidator(), UpdateTripInfo)
route.post("/images/:id", IdParamsValidator(), UploadTripImages)
route.post("/delete-media/:id", validateDeleteTripMdedia(), DeleteTripMedia)
route.delete("/delete/:id", IdParamsValidator(), DeleteTrip)

route.get("/enquiry-all", GetAllTripEnquiries)
route.put("/enquiry/update", enuqiryStatusValidate(), UpdateEnquiryStatus)
route.put("/enquiry/update-transaction", enuqiryTransactionStatusValidate(), UpdateEnquiryTransaction)

export default route
