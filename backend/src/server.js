import dotenv from "dotenv"
import express from 'express'
import cors from 'cors'
import http from "http"
import fileUpload from 'express-fileupload'
import { CORSURLS } from './config/utilities.js'
import compression from 'compression'
import { UrlMiddleware } from './middleware/auth.js'
import SchedulePackageTripStatus from './modules/trips/schedulers/packagetripStatusScheduler.js'
import HotelContentScheduler from './modules/hotels/schedulers/hotelContentScheduler.js'
import currencyRateScheduler from './modules/rates/schedulers/currencyRateScheduler.js'
import PaymentReconcileScheduler from './modules/payments/schedulers/paymentReconcileScheduler.js'
import { unhandledRoutes } from './middleware/error.js'

import apiRoutes from "./routes/index.js"
import { mountSwagger } from "./swagger/index.js"
dotenv.config()

const port = process.env.PORT


const app = express()

const server = http.createServer(app)

SchedulePackageTripStatus()
HotelContentScheduler()
currencyRateScheduler()
PaymentReconcileScheduler()

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }

      return compression.filter(req, res);
    },
  })
)
app.use(
  cors({
    origin: CORSURLS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  })
)
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))
app.use(fileUpload())

app.use(UrlMiddleware)

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🌍✈️ Welcome to Holidaywaka API. Server is up and running!',
  })
})

const swaggerMounted = mountSwagger(app)
app.use("/api", apiRoutes)


// error handling
app.use((error, req, res, next) => {
  console.error(error)
  res
    .status(500)
    .json({ message: 'Something broke!', stack: `${error.message}` })
})

app.use(unhandledRoutes)

server.listen(port, () => {
  console.log(`server running on http://localhost:${port}`)
  if (swaggerMounted) console.log(`swagger docs on http://localhost:${port}/api-docs`)
})

