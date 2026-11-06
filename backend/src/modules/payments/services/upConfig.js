import dotenv from "dotenv"
import crypto from "crypto"
import axios from "axios"
import logger from "../../../middleware/logger.js";

dotenv.config()

/**
 * Unified Payment / Payloft gateway, per "Payloft Generic Merchant Integration API" v1.1:
 *   Create order   POST {UP_URL}/api/transaction/initialize/{UP_MERCHANT_ID}  -> { data: { id, token, isLive } }
 *   Pay            GET  {UP_URL}/{token}                                       (customer redirect)
 *   Status         GET  {UP_URL}/api/transaction/gettransactionstatus/{token}  -> { data: { "Order Id", Status, ... } }
 * Every response is HTTP 200 with { success, message }; success: false is a failure.
 * Base URL: https://pay.mypayloft.com (sk_test_ keys get sandbox orders, isLive: false).
 */
const key = process.env.UP_SECRET_KEY;
const merchantId = process.env.UP_MERCHANT_ID;
const baseUrl = String(process.env.UP_URL ?? "").replace(/\/+$/, "")
const TIMEOUT_MS = 30_000

function gatewayError(error, action) {
    const status = error.response?.status
    const detail = typeof error.response?.data === "string" ? error.response.data.slice(0, 200) : JSON.stringify(error.response?.data ?? "").slice(0, 200)
    logger.error(`[unified-payment] ${action} failed: ${status ?? error.code ?? error.message} ${detail}`)
    return { status: 500, message: `Payment Error: ${status ? `gateway answered ${status}` : error.message}` }
}

function assertSuccess(data, action) {
    if (typeof data !== "object" || data === null) throw new Error(`${action} response is not JSON`)
    if (data.success !== true) throw new Error(`gateway refused the ${action}: ${data.message ?? "no message"}`)
}

/** Creates the order; returns { status: 200, data: { orderId, token, isLive } } */
async function createUpOrder(body) {
    try {
        if (!baseUrl || !merchantId || !key) throw new Error("UP_URL / UP_MERCHANT_ID / UP_SECRET_KEY are not configured")
        const response = await axios.post(`${baseUrl}/api/transaction/initialize/${encodeURIComponent(merchantId)}`, { ...body, secretKey: key }, {
            timeout: TIMEOUT_MS,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
        })
        assertSuccess(response.data, "order")
        const { id, token, isLive } = response.data.data ?? {}
        if (!token) throw new Error(`no token in gateway response: ${JSON.stringify(response.data).slice(0, 200)}`)
        return { status: 200, data: { orderId: id === undefined || id === null ? null : String(id), token, isLive: Boolean(isLive) } }
    } catch (error) {
        return gatewayError(error, "create order")
    }
}

/** The gateway's own record of the transaction (source of truth); data is the raw response to keep for disputes */
async function getUpOrderStatus(token) {
    try {
        if (!baseUrl) throw new Error("UP_URL is not configured")
        const response = await axios.get(`${baseUrl}/api/transaction/gettransactionstatus/${encodeURIComponent(token)}`, {
            timeout: TIMEOUT_MS,
            headers: { Accept: "application/json" },
        })
        assertSuccess(response.data, "status query")
        return { status: 200, data: response.data }
    } catch (error) {
        return gatewayError(error, `status ${token}`)
    }
}

/** The customer's payment page for an order token */
const upPaymentPageUrl = (token) => `${baseUrl}/${token}`

const safeEqual = (a, b) => {
    const left = Buffer.from(String(a ?? ""))
    const right = Buffer.from(String(b ?? ""))
    return left.length === right.length && crypto.timingSafeEqual(left, right)
}

/**
 * The v1.1 guide does not document the callback's authentication. Accept the two schemes Payloft has used:
 * `x-api-key` equal to our secret key, or x-payloft-signature = HMAC-SHA512(raw body, secret key).
 * The callback is only a trigger: the status query decides the outcome.
 */
function verifyUpWebhook({ rawBody, apiKey, signature }) {
    if (!key) return false
    if (apiKey) return safeEqual(apiKey, key)
    if (!signature) return false
    const expected = crypto.createHmac("sha512", key).update(rawBody ?? Buffer.from("")).digest("hex")
    return safeEqual(expected, String(signature).toLowerCase())
}

export {
    createUpOrder,
    getUpOrderStatus,
    upPaymentPageUrl,
    verifyUpWebhook,
}
