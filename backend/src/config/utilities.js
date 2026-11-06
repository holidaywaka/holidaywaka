
import crypto from "crypto"
import bcrypt from "bcrypt"
import logger from "../middleware/logger.js"
import { argon2id, argon2Verify } from "hash-wasm"
import dotenv from "dotenv"

dotenv.config();


export const DocsListings = {
  terms_and_conditions: "Terms and Conditions",
  privacy_policy: "Privacy Policy",
  refund_policy: "Refund Policy",
}

export const USER_TYPES = {
  admin: "ADMIN",
  user: "USER",
}
export const ServerNaira = "₦"

export const verificationTags = {
  registration: "REGISTRATION",
  forgot_password: "FORGOT-PASSWORD"
}

export const ModelIDFormat = (DataTypes) => {
  return {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  }
}


export const ReferenceModelFormat = (DataTypes, model, isNull = true) => {
  return {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: model,
      key: "id"
    },
    onDelete: isNull ? "SET NULL" : "CASCADE",
    onUpdate: "CASCADE",
  }
}

export const ServerError = (res, error, title) => {
  // Expected business errors (CustomError) keep their message; 401/403 would read as an expired session on the client
  const statusCode = Number(error?.statusCode)
  if (statusCode >= 400 && statusCode < 500) {
    return res.status([401, 403].includes(statusCode) ? 400 : statusCode).json({ status: 'failed', message: error.message })
  }
  console.error(`${error}`, title);
  logger.error(title, error)
  return res.status(500).json({ status: 'failed', message: `Sorry, we encountered an issue with this request. Our team has been notified.`, stack: `Error: ${error}` })
}

export async function hashPassword(value) {
  try {
    if (!value || typeof value !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Use Node.js crypto.randomBytes converted to a Uint8Array
    const salt = new Uint8Array(crypto.randomBytes(16));

    const password = await argon2id({
      password: value,
      salt,
      parallelism: 1,
      iterations: 256,
      memorySize: 512, // 512KB
      hashLength: 32,
      outputType: 'encoded',
    });

    return password;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
}

export async function validatePassword(incoming, existing) {
  try {
    // Validate inputs
    if (!incoming || typeof incoming !== 'string') {
      throw new Error('Incoming password must be a non-empty string');
    }
    if (!existing || typeof existing !== 'string') {
      throw new Error('Existing password hash must be a non-empty string');
    }

    let isMatch;
    if (existing.startsWith("$2")) {
      isMatch = await bcrypt.compare(incoming, existing);
    } else {
      isMatch = await argon2Verify({
        password: incoming,
        hash: existing,
      });
    }
    return isMatch;
  } catch (error) {
    logger.error('Error validating password:', error);
    throw error;
  }
}


export const dbStringToJson = (value) => {
  const rawValue = value;
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;

  try {
    return safeParse(rawValue);
  } catch (e) {
    return [rawValue];
  }
}

export const ValidatorError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: errors.array().map((err) => {
      return `[${err.path}]: ${err.msg}`
    }).join(", ").toString()
  })
}

export const NairaRate = "NGN"

export const CORSURLS = [
  'http://localhost:5173',
  'http://localhost:5174',
  "https://dev.holidaywaka.com",
  "https://www.dev.holidaywaka.com",
  "https://holidaywaka.com",
  "https://www.holidaywaka.com",
  "https://holidaywaka.onrender.com",
  "https://www.holidaywaka.onrender.com",
]

export const LOCAL_CORS = [
  'http://localhost:5173',
  'http://localhost:5174',
]

const MainName = "holidaywaka.com"
export function getCookieOptions() {
  const isSecured = process.env.FRONTEND_URL?.endsWith(MainName)
  return {
    httpOnly: true,
    secure: isSecured,
    sameSite: isSecured ? "none" : "lax",
    domain: isSecured ? `.${MainName}` : undefined,
    path: "/",
  }
}

export const MarkupOptions = {
  airport: "AIRPORT TRANSFERS",
  package: "PACKAGE",
  visa: "VISA",
  hotel: "HOTEL",
}

export const SecuredUrls = {
  development: [
    'localhost:5173',
    'localhost:5174',
    "dev.holidaywaka.com",
  ],
  staging: [
    'localhost:5173',
    'localhost:5174',
    "dev.holidaywaka.com",
    "holidaywaka.com",
  ],
  production: [
    "holidaywaka.com",
  ]
}

export function PageOffset({ p, page_size }) {
  const rawPage = parseInt(p, 10);
  const current_page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawPageSize = parseInt(page_size, 10);
  const perPage = !isNaN(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, 100) : 20;

  const offset = (current_page - 1) * perPage;

  return {
    offset,
    perPage,
    page: current_page
  };
}

export function ServerPagination({ page, perPage, count }) {
  const totalItems = Math.max(0, count);
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
  const nextPage = page < totalPages ? page + 1 : null;
  const prevPage = page > 1 && page <= totalPages ? page - 1 : null; // FIXED: removed +1

  return {
    total: totalItems,
    totalPages,
    p: page,
    page_size: perPage,
    nextPage,
    prevPage
  };
}

export const ServerTransactionPaymentType = {
  direct_bank_transfer: 'DIRECT_BANK_TRANSFER',
  unified_payment_transfer: 'UNIFIED_PAYMENT_TRANSFER'
}


export const generateReference = (length = 16) => {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric characters
    .substring(0, length)
    .toUpperCase();
}

export const JsonResponse = (res, status, content) => {
  return res.status(status).json(content)
}

export const iwayResponse = (response) => {
  return response?.result?.message || response?.error?.message || response?.message
}

export const ServerTransactionStatusOptions = {
  pending: "PENDING",
  paid: "PAID",
  part_paid: "PART_PAID",
  submitted: "SUBMITTED",
  declined: "Declined"
}

export const ServerTransactionMainStatus = {
  open: "OPEN",
  close: "CLOSED"
}

export const displayMarkupPercent = (amount, value, vat) => {
  const totalPercentage = value + vat;
  const sum = amount + ((amount * totalPercentage) / 100);
  return sum
}

export const convertSecondsToHours = (value) => {
  return (value / 3600)
}

export function ServerSlugify(name) {
  return name
    .toLowerCase()
    ?.trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const TransactionTypes = {
  trip: "TRIP",
  visa: "VISA",
  transfer: "TRANSFER",
  chauffeur: "CHAUFFEUR",
  hotel: "HOTEL",
}

export const VisaStatusEnums = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
}

export const EmailServicesOptions = [
  "PACKAGE", "TRANSFER", "VISA", "NEWSLETTER", "CONTACT"
]

// Transaction types a voucher can apply to; ALL works on any service
export const VoucherServiceOptions = ["ALL", "TRIP", "VISA", "HOTEL", "TRANSFER", "CHAUFFEUR"]

export const VoucherDiscountTypes = { percentage: "PERCENTAGE", fixed: "FIXED" }

export const VoucherStatusOptions = {
  pending: "pending",
  used: "used",
  declined: "declined",
}

export const CalculateVoucherDiscounts = ({ markup, amount }) => {
  const num2 = parseFloat(markup.value)
  let payable = 0
  if (markup.markup_type === 'fixed') {
    payable = amount - num2
  } else {
    // payable = amount - (num2 / 100) * amount
    payable = amount - (num2 / 100) * amount
  }
  const p = Number(payable.toFixed(2))

  payable = Math.max(0, p)
  return Math.round(payable)
}


export const GetRateValue = (response, currency) => {
  const getRate = {
    ...response.toJSON(),
    quotes: response.quotes
  }
  const quoteKeys = Object.keys(getRate.quotes)
  const quoteValues = Object.values(getRate.quotes)

  let quote = {}
  quoteKeys.map((ele, i) => {
    if (ele.endsWith(currency)) return quote = { quote: ele, value: quoteValues[i] }
  })

  return isRate = quote ? quote : {}
}


export const validateDateFormat = (dateString) => {
  // Define the regex for "YYYY-MM-DD" format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  // Test the format
  if (!dateRegex.test(dateString)) {
    return false // Invalid format
  }

  // Parse the date to ensure it's a valid calendar date
  const [year, month, day] = dateString.split('-').map(Number)

  // Check if the date is valid
  const date = new Date(year, month - 1, day) // JS months are 0-indexed
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}


export const MainStatusOptions = {
  true: 'true',
  false: 'false',
}

export const IsNaira = (req, rate, code) => {
  const isRate = rate ? (req.role !== USER_TYPES.admin) ? { rate: { ...rate.toJSON(), quotes: safeParse(rate.quotes) } } : {} : null
  const getRate = isRate ? isRate.rate?.quotes?.find(ele => ele.quote === "USD") : null
  const isNg = ["ngn", "ng"].includes(code?.toLowerCase())
  const detail = {
    status: isNg,
    symbol: isNg ? ServerNaira : !getRate ? ServerNaira : '$',
    currency: isNg ? 'NGN' : !getRate ? "NGN" : 'USD',
    getRate: getRate ? getRate : { value: 1 }
  }

  return detail
}

export const roundDecimal = (value, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Customer-facing prices are whole units (naira or dollars), rounded up so we never undercharge.
 * Unified Payment charges whole units too, so the shown price is exactly what is charged.
 * Cents are settled first, so float noise (1000.0000000002) does not become 1001.
 */
export const roundUpAmount = (value) => Math.ceil(roundDecimal(Number(value) || 0, 2))

export const safeParse = (data) => {
  if (!data) return [];
  if (typeof data === 'object') return data; // If it's already an array/object, just return it
  try {
    return JSON.parse(data);
  } catch (e) {
    return []; // Fallback if the string itself is malformed JSON
  }
};