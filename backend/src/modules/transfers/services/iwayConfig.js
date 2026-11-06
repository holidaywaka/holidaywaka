import { setCache, cacheKeys, getCache } from "../../../config/cacheConfig.js"
import dotenv from "dotenv"

dotenv.config()



const URI = process.env.IWAY_URI,
    USER_ID = process.env.IWAY_USER_ID,
    PASSWORD = process.env.IWAY_PASSWORD;



const iwayApi = {
    login: `auth/login`, // POST
    refresh: `auth/refresh`, // POST
    transport_nodes: `transport-nodes`, // GET
    find_places: `places/find`, // GET
    single_place: `places`, // GET
    prices: `prices`, // GET
    price_rent: `prices/rent`, // GET
    orders_recommended_time: `orders/recommended-time`, // GET
    orders_check_time: `orders/check-time`, // POST
    orders: `orders`, // POST
    order_approve_transaction: `orders/approve`, // POST
    order_pay_url: `orders/pay-url`, // GET
    orders_trips: `orders/trips`, // GET - PUT
    orders_check_update: `orders/{order_id}/check-update`, // GET
    orders_check_cancel: `orders`, // GET
    orders_trip_cancel: `orders/trips/cancel`, // POST
    documents_send_transaction: `documents/send/{transaction}`, // POST
    documents_transaction: `documents/{transaction}`, // GET
    partners_frame_user_settings: `partners/frame-user-settings/{user_id}`, // GET
    check_time: `orders/check-time`
}


async function IwayLogin() {
    const data = new FormData()
    data.append("user_id", USER_ID)
    data.append("password", PASSWORD)

    try {
        const response = await fetch(`${URI}/${iwayApi.login}`, {
            method: "POST",
            body: data
        })

        const result = await response.json()

        setCache(cacheKeys.auth, result.result.token)
        return { status: 200, token: result.result.token }
    } catch (error) {
        return { status: 500, message: `Login failed: ${error.message}` }
    }
}

async function IwayPost(endpoint, body) {
    try {
        let iscached = getCache(cacheKeys.auth)
        if (!iscached) {
            const auth = await IwayLogin()
            iscached = auth.token
        }

        const uri = `${URI}/${endpoint}?lang=en&user_id=${USER_ID}`
        const response = await fetch(uri, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Authorization": `Bearer ${iscached}`,
                "Content-Type": "application/json",
            }
        })

        const result = await response.json()

        if (!result?.result) return { status: result.error?.status === 200 ? 500 : result.error?.status, message: result.error?.message, isError: true }
        const extras = {
            api_url: uri,
            api_body: body,
            ...result
        }
        return { status: 200, ...extras }
    } catch (error) {
        return { status: 500, message: `Server Error: ${error.message}` }
    }
}

async function IwayPostCancel(endpoint, body) {
    try {
        let iscached = getCache(cacheKeys.auth)
        if (!iscached) {
            const auth = await IwayLogin()
            iscached = auth.token
        }

        const uri = `${URI}/${endpoint}?lang=en`
        const response = await fetch(uri, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Authorization": `Bearer ${iscached}`,
                "Content-Type": "application/json",
            }
        })

        const result = await response.json()

        if (!result?.result) return { status: result.error?.status === 200 ? 500 : result.error?.status, message: result.error?.message, isError: true }
        const extras = {
            api_url: uri,
            api_body: body,
            ...result
        }
        return { status: 200, ...extras }
    } catch (error) {
        return { status: 500, message: `Server Error: ${error.message}` }
    }
}

async function IwayGet(endpoint, params) {
    try {
        let iscached = getCache(cacheKeys.auth)
        if (!iscached) {
            const auth = await IwayLogin()
            iscached = auth.token
        }

        const uri = `${URI}/${endpoint}?lang=en&user_id=${USER_ID}${params ? params : ''}`
        const response = await fetch(uri, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${iscached}`
            }
        })

        const result = await response.json()

        const extras = {
            api_url: uri,
            ...result
        }
        return { status: result.error !== null ? 500 : 200, ...extras }
    } catch (error) {
        return { status: 500, message: `Server Error: ${error.message}` }
    }
}


export {
    iwayApi,
    IwayLogin,
    IwayPost,
    IwayGet,
    USER_ID,
    IwayPostCancel,
}