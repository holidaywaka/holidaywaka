import type { visaEnquiryProps } from "global"

export type formProps = {
    nationality: string
    firstName: string
    lastName: string
    email: string
    phone: string
    travelDate: string | null
    hasPassport: string
    phoneCode: string
    passportNumber: string
    message: string
    paymentType?: paramsProps
}

export type fieldProps = {
    country?: string
    fee?: string
    id?: string
    price?: string
    old_price?: string
    visaType?: string
    requirement?: string
    paymentType?: paramsProps;
    payment_method?: string;
}

export type resultProps = {
    "message": string;
    "data": visaEnquiryProps
    "attachment": string;
    "payment": string;
}

export type paramsProps = 'appointment' | 'fullPayment' | 'enquiry'
