import "dotenv/config";
import axios from "axios";

export const rtConfigs = {
  apiKeyId: process.env.RATEHAWK_API_KEY_ID,
  apiAccessToken: process.env.RATEHAWK_API_KEY_ACCESS_TOKEN,
  apiUrl: process.env.RATEHAWK_API_URL,
};

// Paths are relative to RATEHAWK_API_URL (which ends in /api).
// https://docs.emergingtravel.com/docs/integration-guide/
const rt_apis = {
  // Step 1 - static data (offline sync only, never in the customer-facing flow)
  hotel_static: `b2b/v3/hotel/static/`,
  filter_values: `content/v1/filter_values`,
  hotel_ids_by_filter: `content/v1/hotel_ids_by_filter`,
  hotel_content_by_ids: `content/v1/hotel_content_by_ids`,
  hotel_reviews_by_ids: `content/v1/hotel_reviews_by_ids`,
  b2b_overview: `b2b/v3/overview`,
  // Step 2 - search
  b2b_search_serp_region: `b2b/v3/search/serp/region/`,
  b2b_search_serp_hotels: `b2b/v3/search/serp/hotels`,
  b2b_search_hotel_page: `b2b/v3/search/hp/`,
  // Step 3 - prebook
  b2b_hotel_prebook: `b2b/v3/hotel/prebook/`,
  // Step 4 - booking
  b2b_booking_form: `b2b/v3/hotel/order/booking/form/`,
  b2b_booking_finish: `b2b/v3/hotel/order/booking/finish/`,
  b2b_booking_finish_status: `b2b/v3/hotel/order/booking/finish/status/`,
  // Step 5 - post-booking
  b2b_order_info: `b2b/v3/hotel/order/info/`,
  b2b_order_cancel: `b2b/v3/hotel/order/cancel/`,
  b2b_voucher_download: `b2b/v3/hotel/order/document/voucher/download/`,
}

// Request timeouts (ms). Search calls accept a server-side `timeout` (max 100s);
// prebook recommends a 60s client timeout.
export const RT_TIMEOUTS = {
  default: 30_000,
  search: 45_000,
  prebook: 60_000,
  booking: 60_000,
}

// Observers of every ETG request/response pair (certification logs, debugging)
const exchangeListeners = new Set()

/** Subscribes to ETG request/response pairs; returns the unsubscribe function */
export function onRatehawkExchange(listener) {
  exchangeListeners.add(listener)
  return () => exchangeListeners.delete(listener)
}

function emitExchange(exchange) {
  for (const listener of exchangeListeners) {
    try { listener(exchange) } catch { /* observers must never break a request */ }
  }
}

export class RatehawkError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string|null, status?: number|null, debug?: any }} details
   */
  constructor(message, { code = null, status = null, debug = null } = {}) {
    super(message)
    this.name = "RatehawkError"
    this.code = code
    this.status = status
    this.debug = debug
  }

  get isRateLimited() {
    return this.status === 429
  }
}

async function rt_request({ method, endpoint, data, params, timeout = RT_TIMEOUTS.default, responseType }) {
  if (!rtConfigs.apiUrl || !rtConfigs.apiKeyId || !rtConfigs.apiAccessToken) {
    throw new RatehawkError("RateHawk credentials are not configured", { code: "not_configured" })
  }

  const startedAt = Date.now()
  const trace = (httpStatus, response) => emitExchange({
    method, endpoint, request: data ?? params ?? null, response, httpStatus, durationMs: Date.now() - startedAt, at: new Date(startedAt).toISOString(),
  })

  try {
    const response = await axios.request({
      method,
      url: `${rtConfigs.apiUrl}/${endpoint}`,
      data,
      params,
      timeout,
      responseType,
      auth: {
        username: rtConfigs.apiKeyId,
        password: rtConfigs.apiAccessToken,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Binary documents (vouchers) come back as a file; errors as JSON
    if (responseType === "arraybuffer") {
      const contentType = String(response.headers["content-type"] ?? "")
      if (!contentType.includes("application/json")) {
        trace(response.status, { file: contentType, bytes: response.data?.byteLength ?? 0 })
        return { file: Buffer.from(response.data), contentType }
      }
      const parsed = JSON.parse(Buffer.from(response.data).toString("utf8"))
      trace(response.status, parsed)
      throw new RatehawkError(`RateHawk ${endpoint} failed: ${parsed?.error ?? "unknown"}`, { code: parsed?.error ?? "unknown", status: response.status })
    }

    const body = response.data;
    trace(response.status, body)
    // ETG can answer HTTP 200 with a populated `error` field
    if (body?.error) {
      throw new RatehawkError(`RateHawk ${endpoint} failed: ${body.error}`, {
        code: body.error,
        status: response.status,
        debug: body.debug?.validation_error ?? null,
      })
    }
    return body;
  } catch (error) {
    if (error instanceof RatehawkError) throw error;

    let body = error.response?.data;
    if (body instanceof ArrayBuffer || Buffer.isBuffer(body)) {
      try { body = JSON.parse(Buffer.from(body).toString("utf8")) } catch { body = null }
    }
    trace(error.response?.status ?? null, body ?? { error: error.code ?? error.message })
    const code = body?.error ?? (error.code === "ECONNABORTED" ? "timeout" : error.code ?? "unknown");
    throw new RatehawkError(`RateHawk ${endpoint} failed: ${code}`, {
      code,
      status: error.response?.status ?? null,
      debug: body?.debug?.validation_error ?? null,
    })
  }
}

function rt_post({ endpoint, data, timeout }) {
  return rt_request({ method: "POST", endpoint, data, timeout })
}

function rt_fetch({ endpoint, timeout }) {
  return rt_request({ method: "GET", endpoint, timeout })
}

/** GET returning a file ({ file: Buffer, contentType }); ETG errors still raise RatehawkError */
function rt_download({ endpoint, params, timeout }) {
  return rt_request({ method: "GET", endpoint, params, timeout, responseType: "arraybuffer" })
}

const ratehawkConfig = {
  fetch: rt_fetch,
  post: rt_post,
  download: rt_download,
  apis: rt_apis,
}

export default ratehawkConfig;
