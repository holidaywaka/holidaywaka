import type { TripEnquiryProps } from "global"

export type packagePropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": TripEnquiryProps[]
}