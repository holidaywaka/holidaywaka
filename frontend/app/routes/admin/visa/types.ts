import type { visacountryProps, visaEnquiryProps } from "global"


export type visaCountryPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": visacountryProps[]
}

export type visaEnquiryPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": visaEnquiryProps[]
}


export interface visacountryFormProps {
  "id"?: string | number
  "country"?: string
  "fee"?: string
  "status"?: string
  "destinations"?: {
    id?: number
    "visaType": string
    "requirement": string
    "price": string
    "old_price": string
  }[] | null
  "createdAt"?: string
  "updatedAt"?: string
}