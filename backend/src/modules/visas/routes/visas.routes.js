import { USER_TYPES } from '../../../config/utilities.js'
import { createVisaEnquiry, GetAllVisaEnquiries, UpdateVisaEnquiryStatus, AddVisaCountry, UpdateVisaCountry, GetAllVisaCountries, DeleteVisaCountry, AdminGetAllVisaCountries, UpdateVisaEnquiryTransaction } from '../controller/visas.controller.js'
import { authenticate, authorized, includeAdminMiddleware } from '../../../middleware/auth.js'
import { enuqiryTransactionStatusValidate } from '../../trips/validator/trips.validator.js'
import { IdParamsValidator } from '../../../validators/common.validator.js'
import { visaenquiryValidator, createVisaCountryValidator, updateVisaEnquiryValidator } from '../validator/visas.validator.js'
import express from "express"

const route = express.Router()

route.post("/enquiry/create", includeAdminMiddleware, visaenquiryValidator(), createVisaEnquiry)
route.get("/visa-country/all", GetAllVisaCountries)


route.use(authenticate)
route.use(authorized(USER_TYPES.admin))


route.get("/enquiry/all", GetAllVisaEnquiries)
route.get("/all", AdminGetAllVisaCountries)
route.put("/enquiry/update", updateVisaEnquiryValidator(), UpdateVisaEnquiryStatus)
route.post("/visa-country/create", createVisaCountryValidator(), AddVisaCountry)
route.put("/visa-country/update/:id", IdParamsValidator(), UpdateVisaCountry)
route.delete("/visa-country/:id", IdParamsValidator(), DeleteVisaCountry)
route.put("/enquiry/update-transaction", enuqiryTransactionStatusValidate(), UpdateVisaEnquiryTransaction)

export default route