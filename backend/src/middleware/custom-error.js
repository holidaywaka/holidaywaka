class CustomError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors.length > 0 ? errors : undefined
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export default CustomError
