import express from 'express'
import userRoutes from "../modules/users/routes/users.routes.js"
import bankRoutes from "../modules/banks/routes/banks.routes.js"
import contactRoutes from "../modules/contacts/routes/contacts.routes.js"
import socialRoutes from "../modules/socials/routes/socials.routes.js"
import rateRoutes from "../modules/rates/routes/rates.routes.js"
import newsletterRoutes from "../modules/newsletters/routes/newsletters.routes.js"
import markupRoutes from "../modules/markups/routes/markups.routes.js"
import visaRoute from "../modules/visas/routes/visas.routes.js"
import blogRoutes from "../modules/blogs/routes/blogs.routes.js"
import tripRoutes from "../modules/trips/routes/trips.routes.js"
import voucherRoutes from "../modules/vouchers/routes/vouchers.routes.js"
import transactionRoute from "../modules/transactions/routes/transactions.routes.js"
import iwayRoute from "../modules/transfers/routes/transfers.routes.js"
import upRoute from "../modules/payments/routes/payments.routes.js"
import docsRoute from "../modules/docs/routes/docs.routes.js"
import hotelRoutes from '../modules/hotels/routes/hotels.routes.js'
import dashboardRoutes from '../modules/dashboard/routes/dashboard.routes.js'

const route = express.Router();

route.use("/users", userRoutes)
route.use("/bank", bankRoutes)
route.use("/contacts", contactRoutes)
route.use("/voucher", voucherRoutes)
route.use("/trips", tripRoutes)
route.use("/blogs", blogRoutes)
route.use("/visa", visaRoute)
route.use("/markups", markupRoutes)
route.use("/newsletters", newsletterRoutes)
route.use("/rates", rateRoutes)
route.use("/socials", socialRoutes)
route.use("/v4", iwayRoute)
route.use("/transactions", transactionRoute)
route.use("/up", upRoute)
route.use("/docs", docsRoute)
route.use("/hotels", hotelRoutes)
route.use("/dashboard", dashboardRoutes)


export default route