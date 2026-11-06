import axios from "axios";
import { API_URL } from "./api-base";

export const URI: string = API_URL;

function ApiErrorHandler(result: { errors: { message: string }[], message: string }) {

    if (result.errors && result.errors.length > 0) {
        const outcome: string[] = []
        result.errors.map((ele: { message: string }) => {
            return outcome.push(ele.message)
        })
        throw new Error(`${outcome.join(', ') || "An error occurred"}`);
    } else {
        throw new Error(`${result.message || "An error occurred"}`);
    }
}

export type createResponseProps = {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    type?: 'FILE' | 'JSON';
    data?: any,
    headers?: any;
    origin?: string | null
}

export const createResponse = async ({
    endpoint,
    method = "GET",
    type = "JSON",
    data,
    headers,
    origin = null
}: createResponseProps) => {
    const isFormData = type === "FILE"
    const isGet = method === "GET"

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const targetUrl = origin ? origin : `${URI}/${endpoint}`
    const response = await axios.request({
        url: targetUrl,
        method,
        ...(isGet ? {} : { data }),
        timeout: 500000,
        withCredentials: !origin,
        // resolve every status so errors are handled below instead of thrown by axios
        validateStatus: () => true,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(headers ? { ...headers } : {}),
            'X-Client-Type': 'admin',
            "x-time-zone": userTimeZone
        }
    }).catch(() => {
        // No response at all (connection dropped, request timed out at the host): the browser only says "Failed to fetch"
        throw new Error(isFormData
            ? "The upload didn't reach the server. Check your connection, or try fewer or smaller files."
            : "Unable to reach the server. Check your connection and try again.")
    })
    const result = response.data === "" ? null : response.data

    if (response.status < 200 || response.status >= 300) {
        if ([401, 403].includes(response.status)) {
            return window.location.href = "/login"
        }
        ApiErrorHandler(result ?? {})
    }
    return result
}

/** Downloads a file endpoint (e.g. a hotel voucher PDF) and saves it with the server's filename */
export async function downloadFile(endpoint: string, fallbackName: string) {
    const response = await fetch(`${URI}/${endpoint}`, { credentials: 'include', headers: { 'X-Client-Type': 'admin' } })
    if (!response.ok) {
        let message = 'Download failed'
        try { message = (await response.json())?.message ?? message } catch { /* not JSON */ }
        throw new Error(message)
    }
    const disposition = response.headers.get('content-disposition') ?? ''
    const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackName
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export const NewApis = {
    users: {
        add_admin: "users/add-admin",
        login: "users/login",
        logout: "users/logout",
        profile: "users",
        notifications: "users/notifications",
        change_password: "users/password",
        verify_email: "users/verify-email",
        forgot_password: "users/forgot-password",
        resend_password: "users/resend",
        reset_password: "users/reset-password",
    },
    bank: {
        bank: "bank",
    },
    contacts: {
        contacts: "contacts"
    },
    voucher: {
        all: "voucher/all",
        single: "voucher",
        preview: "voucher/preview",
        create: "voucher/create",
        update: "voucher/update",
        delete: (id: string) => `voucher/${id}`,
        logs: (id: string) => `voucher/${id}/logs`,
    },
    trips: {
        trips: "trips",
        admin_all: "trips/all",
        single: "trips/single",
        enquiry: "trips/enquiry",
        destinations: "trips/destinations/all",
        create: "trips/create",
        update: "trips/update",
        delete_media: "trips/delete-media",
        delete: "trips/delete",
        all_enquiry: "trips/enquiry-all",
        update_enquiry: "trips/enquiry/update",
        single_enquiry: "trips/enquiry/single",
        update_transaction: "trips/enquiry/update-transaction",
        quote: "trips/quote",
    },
    blogs: {
        blogs: "blogs",
        admin_all: "blogs/admin/all",
        create: "blogs/create",
        update: "blogs/update",
        delete: "blogs/delete",
    },
    visa: {
        create_enquiry: "visa/enquiry/create",
        all_enquiries: "visa/enquiry/all",
        all_countries: "visa/visa-country/all",
        admin_all: "visa/all",
        update_enquiry: "visa/enquiry/update",
        visa_country: "visa/visa-country/create",
        update_country: "visa/visa-country/update",
        delete_country: "visa/visa-country",
        update_transaction: "visa/enquiry/update-transaction",
    },
    markups: {
        markups: "markups"
    },
    newsletters: {
        newsletters: "newsletters"
    },
    rates: {
        rates: "rates"
    },
    socials: {
        socials: "socials",
        admin_all: "socials/all",
    },
    v4: {
        transport_nodes: "v4/transport-nodes",
        find_place: "v4/find-place",
        check_time: "v4/check-time",
        transfer_offer_pricing: "v4/transfer-offer-pricing",
        chauffer_offer_pricing: "v4/chauffeur-offer-pricing",
        check_canellation: "v4/check-cancellation",
        order_cancellation: "v4/order-cancellation",
        payment_link: "v4/payment-link",
        verify_order: "v4/verify-order",
        create_order: "v4/create-order",
        all_orders: "v4/all-orders",
        transfer_invoice: "v4/transfer-invoice",
        resync_order: "v4/resync-order",
        update_payment: "v4/update-payment",
    },
    transactions: {
        upload_proof: "transactions/upload-payment-proof",
        transaction: "transactions",
        verify_transaction: "transactions/verify",
        webhook: "transactions/webhook",
        all: "transactions/all",
        all_timelines: "transactions/timelines",
        payment_status: (id: string) => `transactions/${id}/payment-status`,
    },
    docs: {
        all: 'docs',
        tag: 'docs/tag',
        manage: 'docs/manage',
        admin_all: 'docs/all',
        delete: 'docs/tag',
    },
    dashboard: {
        dashboard: "dashboard",
        insights: "dashboard/insights",
    },
    hotels: {
        destinations: "hotels/destinations",
        popular_destinations: "hotels/destinations/popular",
        filters: "hotels/filters",
        search: "hotels/search",
        single: (hid: number) => `hotels/${hid}`,
        rates: (hid: number) => `hotels/${hid}/rates`,
        prebook: "hotels/prebook",
        single_prebook: (id: string) => `hotels/prebook/${id}`,
        bookings: "hotels/bookings",
        single_booking: (id: string) => `hotels/bookings/${id}`,
        booking_voucher: (id: string) => `hotels/bookings/${id}/voucher`,
        admin_bookings: "hotels/admin/bookings",
        admin_booking: (id: string) => `hotels/admin/bookings/${id}`,
        admin_cancel: (id: string) => `hotels/admin/bookings/${id}/cancel`,
        admin_retry: (id: string) => `hotels/admin/bookings/${id}/retry`,
        admin_refresh: (id: string) => `hotels/admin/bookings/${id}/refresh`,
        admin_voucher: (id: string) => `hotels/admin/bookings/${id}/voucher`,
        admin_sync: "hotels/admin/sync",
    }
}