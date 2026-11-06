import type { PackageEnquiryProps, TripEnquiryProps, TripProps } from "global"

export type tripEnquiryPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": TripEnquiryProps[]
}

export type packagePropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": TripProps[]
}

export interface TripFormProps {
  "id"?: string
  "title"?: string
  "summary"?: string
  "tripType"?: string
  "status"?: string
  "startDate"?: string
  "endDate"?: string
  "description"?: string
  "slug"?: string
  "fulfillmentStatus"?: string
  "duplicate"?: string
  "destinations"?: {
    id: number
    "country": string
    "city": string
  }[] | undefined
  "itineraries"?: {id?: number, content?: string}[] | undefined
  "inclusions"?: {id?: number, content?: string}[] | undefined
  "prices"?: {
    id: number
    "price": string
    "priceType": string
  }[] | undefined
  "images"?: {id?: number, img?: string, file?: File | null}[] | undefined
  "visaRequired"?: boolean
  "visaProcessingDays"?: number
  "createdAt"?: string
  "updatedAt"?: string
}