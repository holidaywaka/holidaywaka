import { API_URL } from "./api-base";

export const URI: string = API_URL;

const trips = "trips"
const user = 'users'
const services = 'services'
const blogs = 'blogs'
const visa = 'visa'
const iway = 'v4'
const transactions = 'transactions'

const visa_urls = {
    create_enquiry: visa + `/enquiry/create`,
    all_enquiry: visa + `/enquiry/all`,
    update_enquiry: visa + `/enquiry/update`,
    all_visa_country: visa + `/visa-country/all`,
    create_visa_country: visa + `/visa-country/create`,
    update_visa_country: visa + `/visa-country/update`,
    delete_visa_country: visa + `/visa-country`,
}

const iway_urls = {
    rate: iway + "/rate",
    transport_nodes: iway + "/transport-nodes",
    find_place: iway + "/find-place",
    check_time: iway + "/check-time",
    single_place: iway + "/find-place",
    transfer_offer_pricing: iway + "/transfer-offer-pricing",
    chauffeur_offer_pricing: iway + "/chauffeur-offer-pricing",
    create_order: iway + "/create-order",
    orders: iway + "/all-orders",
    transfer_invoice: iway + "/transfer-invoice",
    check_cancellation: iway + "/check-cancellation",
    order_cancellation: iway + "/order-cancellation",
    payment_link: iway + "/payment-link",
    verify_payment: iway + "/verify-order",
    resync_order: iway + "/resync-order",
    update_payment: iway + "/update-payment",
}

const trip_urls = {
    all: trips + `/`,
    single: trips + `/`,
    create: trips + `/create`,
    destinations: trips + `/destinations/all`,
    duplicate: trips + `/duplicate`,
    update: trips + `/update`,
    upload_media: trips + `/upload-medias`,
    delete: trips + `/delete`,
    delete_media: trips + `/delete-media`,
    update_status: trips + `/update-status`,
    manage_trip_fields: trips + `/manage-trip-fields`,
    enquiry: trips + `/enquiry`,
    enquiries: trips + `/enquiry-all`,
    update_enquiry: trips + `/enquiry/update`,
    update_enquiry_transaction: trips + `/enquiry/update-transaction`,
}

const transactions_urls = {
    upload_payment_proof: transactions + "/upload-payment-proof",
    single_transaction: transactions + "",
    all_transactions: transactions + `/all`,
    transaction_timline: transactions + `/timelines`,
}

const service_urls = {
    all: services + `/`,
    single: services + `/`,
    create: services + `/create`,
    update: services + `/update`,
    delete: services + `/delete`,
    update_status: services + `/update-status`,

    newsletters: services + `/newsletters`,
    all_newsletters: services + `/newsletters/all`,

    add_socials: services + "/socials/create",
    update_socials: services + "/socials/update",
    delete_socials: services + "/socials/delete",
    all_socials: services + "/socials",

    create_markup: services + "/markups/create",
    update_markup: services + "/markups/update",
    delete_markup: services + "/markups/delete",
    all_markup: services + "/markups/all",

    create_email_template: services + "/email-templates/create",
    update_email_template: services + "/email-templates/update",
    delete_email_template: services + "/email-templates/delete",
    all_email_template: services + "/email-templates/all",

    rate: services + "/rate/all",
    add_rate: services + "/rate/create",
    update_rate: services + "/rate/update",
    delete_rate: services + "/rate/delete",
}


const blog_urls = {
    create: blogs + "/create",
    update: blogs + "/update",
    update_status: blogs + "/update-status",
    delete: blogs + "/delete",
    all: blogs + "/",
    single: blogs + "/",
}

const auth_urls = {
    login: user + "/login",
    password: user + "/password",
    profile: user + "/",
    manage_bank: user + "/manage-bank",
    bank: user + "/bank",
    contact: user + "/contact",
    notifications: user + "/notifications",
}

export const Apis = {
    trips: trip_urls,
    auth: auth_urls,
    services: service_urls,
    blogs: blog_urls,
    visa: visa_urls,
    iway: iway_urls,
    transactions: transactions_urls,
}


export const Post = async (endpoint: string, data: any) => {
    const response = await fetch(`${URI}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}

export const Get = async (endpoint: string) => {
    const response = await fetch(`${URI}/${endpoint}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}

export const Geturl = async (endpoint: string) => {
    const response = await fetch(`${URI}/${endpoint}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}

export const Posturl = async (endpoint: string, data: any, type: 'FILE' | 'JSON' = "JSON") => {
    const isFormData = type === "FILE"

    const response = await fetch(`${URI}/${endpoint}`, {
        method: "POST",
        body: isFormData ? data : JSON.stringify(data),
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        }
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}

export const Puturl = async (endpoint: string, data: any, type: 'FILE' | 'JSON' = "JSON") => {
    const isFormData = type === "FILE"

    const response = await fetch(`${URI}/${endpoint}`, {
        method: "PUT",
        body: isFormData ? data : JSON.stringify(data),
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        }
    })
    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}


export const Deleteurl = async (endpoint: string) => {

    const response = await fetch(`${URI}/${endpoint}`, {
        method: "DELETE",
        headers: {
        }
    })
    if (response.statusText === "No Content") return true

    const result = await response.json()
    if (!response.ok) {
        throw new Error(`${result.message || "An error occurred"}`);
    }
    return result
}
