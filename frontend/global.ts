import type dayjs from "dayjs"
import type { ReactNode } from "react"

export interface phoneSelectorProps {
  title?: string
  setup: (value: phoneSelectorSetup) => void
  defaultValue: string
}

export type navlinkProps = 'profile' | 'password' | 'notifications' | 'account' | 'rates' | 'markup' | 'social' | 'newsLetter-subscriptions' | 'contacts' | 'trips' | 'packages' | 'visa-enquiries' | 'package-enquiries' | 'blog' | 'services' | 'visa-countries' | 'transactions' | 'users' | 'home' | 'transfers' | 'email-templates' | 'docs' | 'hotel-bookings' | 'hotel-content' | 'vouchers'

export interface ratesProps {
  "id"?: number
  "source"?: string
  "date"?: string
  "quotes"?: {
    "quote": string
    "value": string
  }[]
  // "quotes"?: {
  //   [key: string]: number
  // }
  "status"?: string
  "createdAt"?: string
  "updatedAt"?: string
}

export interface visaEnquiryProps {
  "id"?: number
  "firstName"?: string
  "lastName"?: string
  "email"?: string
  "phone"?: string
  "nationality"?: string
  "visa"?: {
    "country": string
    "paymentType": string
    "price": string
    "requirement": string
    "visaType": string
    "fee": string
    "amount": string
    "paymentStatus": string
  },
  "hasPassport"?: string
  "passportNumber"?: string
  "travelDate"?: string
  "message"?: string
  "status"?: string
  "createdAt"?: string
  "updatedAt"?: string
  Transaction?: TransactionProps
}

export interface phoneSelectorSetup {
  code?: string
  dial_code?: string
  abbreviation?: string
}

export interface SelectformProps {
  onChange?: () => void
  children: ReactNode
  value?: string | number
  className: string
  name?: string
  label?: string
}

export interface mantineoptionsProps {
  label: string
  value: string
}

export type tripInfoProps = {
  package: TripProps | undefined | null
  form: PackageEnquiryProps
  totalPayment: number
}

export interface TripEnquiryProps {
  "id"?: string
  "userId"?: string
  "tripId"?: string
  "travelDate"?: string
  "message"?: string
  "status"?: 'UNFULFILLED' | 'FULFILLED'
  "tripType"?: 'PRIVATE' | 'GROUP'
  "travelers"?: {
    "firstName": string
    "lastName": string
    "email": string
    "phone": string
    "gender": 'Male' | 'Female'
    "tag": string
    "phoneCode": string
    "priceAmount": string
  }[]
  "totalPrice"?: number
  "createdAt"?: string
  "updatedAt"?: string
  "Transactions"?: TransactionProps,
  "Trip"?: {
    title: string
  }
}

export interface PackageEnquiryProps {
  travelDate?: null | string
  message?: string
  adults_amount?: number
  children_amount?: number
  infant_amount?: number
  travelers?: {
    firstName: string
    lastName: string
    gender: string
    phone: string
    email?: string
    phoneCode: string
    tag: string
    priceAmount: string
    priceType?: string
  }[]
}

export type paginationTypeProps = 'next' | 'previous' | 'current'

export type paginationActionProps = (page: number, type: paginationTypeProps) => void;


export interface ForminputProps {
  valueName?: string
  tagNames?: string[] | undefined
  readOnly?: boolean
  searchable?: boolean
  styles?: any
  inputStyles?: { [key: string]: string | number }
  currencyValue?: string
  setup?: (value: phoneSelectorSetup) => void
  setFieldValue?: any
  valueText?: string | null
  className?: string
  dateTag?: 'From' | 'To' | ""
  formtype?: "textarea" | "password" | "select" | "input" | "date" | "datetime" | "phone" | "currency" | "custom-selector" | "url" | "number" | 'tags' | 'exp' | 'card' | 'cvv' | 'otp'
  content: string
  type?: string
  children?: ReactNode
  options?: any
  placeholder?: string
  error: string
  value?: string
  minDate?: string
  maxDate?: string
  defaultDate?: string
  onChange?: any
  picker?: "date" | "month" | "quarter" | "time" | "week" | "year"
}


export interface FormbuttonProps {
  title: string
  disabled?: boolean
  bg?: string
  Icon?: any
  loading?: boolean
  type?: "submit" | "reset" | "button"
  position?: "left" | "right"
  onClick?: (val: any) => void
}
export type transferFormProps = {
  adults_amount: number
  children_amount: number
  time: string | null
  flight_number: string
  terminal_number: string
  train_number: string
  train_carriage_number: string
  passengers: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
    phoneCode: string
    tag: string
    service: string
  }[]
}
export interface singlePlaceProps {
  airportStart?: boolean
  address?: string
  lat?: number
  lng?: number
  viewpor_northeast_lat?: number
  viewpor_southwest_lng?: number
  place_id?: string
  formatted_address?: string
  address_components?: {
    types: string[]
    long_name: string
    short_name: string
  }[]
}

export interface findplaceProps {
  description?: string
  place_id?: string
  reference?: string
  address?: string
  sub_name?: string
  airportStart?: boolean
}

export interface transportNodesProps {
  airportStart?: boolean
  address?: string
  sub_name?: string
  lat?: string
  lng?: string
  description?: string
  place_id?: string
  country?: string
  iata?: string
  city?: string
}

export interface deleteLayoutProps {
  title: string
  subtitle: string
  status: boolean
  publish?: boolean
  actionText: string
}

export interface transferOfferPriceprops {
  pickup_type?: 'chauffeur' | 'transfer'
  delivery_costs?: number
  price_per_hour?: number
  car_preparation_price?: number
  travel_time?: number
  delivery_distance?: number
  distance?: number
  price_uid?: string
  price_id?: number
  price_rub?: number
  payable?: number
  alternative_price?: number
  charge?: {
    currency: string
    amount: number | null
    delivery_costs: number | null
    price_per_hour: number | null
  }
  currency?: string
  service_id?: number
  minimum_duration?: number
  minimum_duration_count?: number
  minimum_duration_text?: string
  car_id?: number
  car_title?: string
  car_model?: string
  car_photo?: string
  car_capacity?: number
  car_luggage_capacity?: number
  car_deleted?: boolean
  meeting_with_table?: boolean
  allowable_subaddress?: number
  price_subaddress_rub?: number
  alternative_price_subaddress?: number
  cancellation_time?: number
  payed_road?: boolean
  blackout_date?: string[]
  allowable_time?: number
  is_fast_ride?: boolean
  is_special?: boolean
  is_fast_booking?: boolean
  reward?: number
  class_services?: {
    id: number
    title: string
    value: number | string | null
  }[]
  service_provider?: {
    title: string
    rating: number
    logo: string
  }
  start_place?: {
    place_id: number
    zone_code: string
    title: string
    type_title: string
    terminal: string
  },
  finish_place?: {
    place_id: number
    zone_code: string
    title: string
    type_title: string
    terminal: string
  },
  additional_services?: {
    id: number
    additional_service_id: number
    price: number
    name: string
    uid: string
    slug: string
    default_include: boolean
    currency: string
    category: string
    type: string
    service_provider_id: number
    is_special: boolean
    price_rub: number
    alternative_price: number
    charge: {
      price: number
      currency: string
      rate: number
    }
  }[]
  additional_services_revert?: {
    id: number
    additional_service_id: number
    price: number
    name: string
    uid: string
    slug: string
    default_include: boolean
    currency: string
    category: string
    type: string
    service_provider_id: number
    is_special: boolean
    alternative_price: number
  }[]
}

export interface EndpointProps {
  endpoint: string
  data?: any
}

export interface newslettersProps {
  email?: string
  createdAt?: string
  id?: number
}
export interface ContactProps {
  name?: string
  createdAt?: string
  contact?: string
  message?: string
  id?: number
}

export interface BlogProps {
  title: string
  createdAt: string
  status: string
  content: string
  image: string
  media: string
  read: string
  url: string
  slug: string
  id: number
}

export interface ServiceProps {
  title?: string
  createdAt?: string
  status?: string
  content?: string
  image?: string
  id?: number
}

export interface visacountryProps {
  "id"?: string | number
  "country"?: string
  "fee"?: string
  "status"?: string
  "destinations"?: visaCountryDestinationProps[]
  "createdAt"?: string
  "updatedAt"?: string
}

export type visaCountryDestinationProps = {
    "visaType": string
    "requirement": string
    "price": string
    "old_price": string
  }

export type discountProps = 'Fixed' | 'Percentage' | 'FIXED' | 'PERCENTAGE' | 'percentage' | 'fixed' | undefined


export interface markupProps {
  tag?: string
  createdAt?: string
  status?: string
  currency?: string
  discountType?: discountProps
  discountValue?: number
  vat?: number
  id?: string
}

export interface SocialsProps {
  tag?: string
  createdAt?: string
  status?: string
  link?: string
  id?: number
}

export interface TransactionProps {
  "id"?: string
  "declineReason"?: string
  /** Exact status JSON from Unified Payment (empty array when none) */
  "gatewayResponse"?: Record<string, unknown> | unknown[] | null
  "gatewayStatus"?: string | null
  "discount"?: number
  "voucherCode"?: string | null
  "image"?: string
  "userId"?: string
  "tripId"?: string
  "transferId"?: string
  "txType"?: string
  "txid"?: string
  "amount"?: number
  "charge"?: {
    "currency": string
    "amount": number
    "rate": number
    "vat": number
    "markup_value": number
  },
  "status"?: string
  "paymentStatus"?: string
  "paymentType"?: string
  "createdAt"?: string
  "updatedAt"?: string
  "TransactionTimelines"?: TimelineProps[]
  "Transfer"?: transferOfferPriceprops
}

export interface NotificationProps {
  id?: number,
  title?: string,
  content?: string,
  createdAt?: string,
}

export interface TimelineProps {
  paid?: number,
  balance?: number,
  datePaid?: string,
  createdAt?: string,
}

export interface bankProps {
  id?: number
  accountName?: string
  accountNumber?: string
  bankName?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface TripProps {
  "id": string;
  "title": string;
  "summary": string;
  "tripType": string;
  "status": string;
  "startDate": string;
  "endDate": string;
  "description": string;
  "slug": string;
  "fulfillmentStatus": string;
  "duplicate": string;
  "destinations": {
    "country": string;
    "city": string;
  }[]
  "itineraries": string[]
  "inclusions": string[]
  "prices": {
    "price": string;
    "priceType": string;
  }[]
  "images": string[]
  "createdAt": string;
  "updatedAt": string;
  "currency": string;
  "symbol": string;
  "accountName": string;
  "accountNumber": string;
  "bankName": string;
  "visaRequired"?: boolean;
  "visaProcessingDays"?: number;
  /** YYYY-MM-DD; set when the package needs a visa (processing days + 1) */
  "earliestTravelDate"?: string | null;
}

export type geoLocationProps = {
  "ip"?: string
  "asn"?: string
  "as_name"?: string
  "as_domain"?: string
  "country_code"?: string
  "country"?: string
  "continent_code"?: string
  "continent"?: string
  "currency"?: string
  "abbreviation"?: string
  "symbol"?: string | null
  flag?: string
}

export interface Mediasprops {
  media?: string
  type?: string
  id?: string | number
  file?: any
}

export interface Packageprops {
  title?: string
  id?: string
  media?: Mediasprops[]
}

export interface FileUploaderProps {
  medias: Mediasprops[]
  setMedias: (value: Mediasprops[]) => void
  singles: TripProps
}

export type iwayOrderProps = {
  duration?: number
  is_fast_ride?: 'true' | 'false'
  "date_change"?: string
  "date"?: string
  "date_arrival"?: string
  "user_id"?: string
  "order_id"?: string
  "order_type"?: string
  "transaction"?: string
  "payable_status"?: string
  "status"?: string
  "ex_order_status"?: string
  "payable"?: string
  "markup"?: string
  "bookingCode"?: string
  "allowable_booking_time"?: string
  "cancellation_time"?: string
  "currency"?: string
  "price_id"?: number
  "price"?: number
  "car_title"?: string
  "car_capacity"?: string
  "car_models"?: string
  "car_photo"?: string
  "car_class_id"?: number
  "passengers"?: {
    "name": string
    "email": string
    "phone": string
  }[]
  "total_adults"?: number
  "total_children"?: number
  "coordinator_name"?: string
  "coordinator_phone"?: string
  "additional_services"?: {
    "additional_service_list_id": number
    "type": string
    "category": string
    "price": number
    "service_provider_id": number
  }[]
  "viewers"?: string
  "driver_data"?: string
  "service_provider"?: string
  "fare_on_toll_road"?: string
  "service_id"?: string
  "cancellation_time_without_penalty"?: string
  "origin"?: {
    "title": string
    "type": string
    "city": string
    "city_id": number
    "terminal_number": string
    "train_carriage_number": null,
    "timezone": string
    "flight_number": string
    "address": string
    "lat": number
    "lng": number
    "place_id": string
  }
  "destination"?: {
    "title": string
    "type": string
    "city": string
    "city_id": number
    "terminal_number": string
    "timezone": string
    "flight_number": string
    "address": string
    "lat": number
    "lng": number
    "place_id": string
  }
}

export interface transferOrder {
  "id"?: number
  trips?: iwayOrderProps[]
  charge?: {
    currency: string
    amount: number | null
    delivery_costs: number | null
    price_per_hour: number | null
  }
  "pickup_type"?: string
  "payable"?: string
  "order_id"?: string
  "markup"?: string
  "createdAt"?: string
  "updatedAt"?: string
  Transactions?: TransactionProps
}

