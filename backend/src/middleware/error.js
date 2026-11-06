import { JsonResponse } from "../config/utilities.js"
import logger from "./logger.js"



/** Global error handler */
const globalErrorHandler = (err, req, res, next) => {
  /* Bad JSON request body */
  if (err.type === 'entity.parse.failed') {
    return JsonResponse(res, 400, {
      message: 'Bad JSON request body',
    })
  }

  /* Validator error */
  if (err.name === 'ValidationError') {
    return JsonResponse(res, 400, {message: err.message})
    // return res.status(400).send({
    //   status: 'error',
    //   message: err.message,
    // })
  }

  /* Jwt invalid token error */
  if (err.name === 'JsonWebTokenError') {
    return JsonResponse(res, 401, {message: 'Invalid token. Please log in again!'})
    // return res.status(401).send({
    //   status: 'error',
    //   message: 'Invalid token. Please log in again!',
    // })
  }

  /* Jwt expired token error */
  if (err.name === 'TokenExpiredError') {
    return JsonResponse(res, 401, {message: 'Your token has expired. Please log in again!'})
    // return res.status(401).send({
    //   status: 'error',
    //   message: 'Your token has expired. Please log in again!',
    // })
  }

  /* Log the errors we didn't handle */
  logger.error(`[GlobalErrorHandler]: ${err.message}`)

  const statusCode = err.statusCode === 200 ? 500 : err.statusCode || 500
  const message = `${statusCode}`.startsWith('4')
    ? err.message
    : 'Something went wrong!, ' + err.message

  return JsonResponse(res, statusCode, { message, ...(err.errors && { errors: err.errors }) })

  // res.status(statusCode).send({
  //   status: 'error',
  //   message,
  //   ...(err.errors && { errors: err.errors }),
  // })
}

/** Handles request to routes that are not available on the server */
const unhandledRoutes = (req, res, next) => {

  return JsonResponse(res, 404, { message: `${req.method} request to: ${req.originalUrl} not available on this server!` })
  // return res.status(404).send({
  //   status: 'error',
  //   message: `${req.method} request to: ${req.originalUrl} not available on this server!`,
  // })
}

export { globalErrorHandler, unhandledRoutes }
