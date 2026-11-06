import type { HotelRate, HotelRegion, HotelStaySummary, HotelGuestRoom } from '~/routes/general/hotel-search/types';

export type amenityGroupProps = {
    group_name: string;
    amenities: string[];
    non_free_amenities: string[] | null;
}

export type hotelDescriptionProps = {
    title: string;
    paragraphs: string[];
}

export type hotelImageProps = {
    url: string;
    category_slug: string;
}

export type hotelRoomGroupProps = {
    name: string;
    name_struct: { main_name: string; bedding_type: string; bathroom: string };
    room_amenities: string[];
    images: hotelImageProps[];
    rg_ext: Record<string, number> | null;
}

export type hotelFactsProps = {
    electricity?: { frequency: number[]; voltage: number[]; sockets: string[] };
    floors_number?: number;
    rooms_number?: number;
    year_built?: number;
    year_renovated?: number;
}

/** ETG metapolicy: every key holds a list of policy entries, except no_show / visa which are objects */
export type hotelMetapolicyProps = Record<string, Record<string, unknown>[] | Record<string, unknown>>;

export type hotelProps = {
    hid: number;
    name: string;
    kind: string | null;
    star_rating: number;
    hotel_chain: string | null;
    address: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    region: HotelRegion | null;
    check_in_time: string | null;
    check_in_time_end: string | null;
    check_out_time: string | null;
    front_desk_time_start: string | null;
    front_desk_time_end: string | null;
    is_closed: boolean;
    is_gender_specification_required: boolean;
    images: hotelImageProps[];
    amenity_groups: amenityGroupProps[];
    description_struct: hotelDescriptionProps[];
    metapolicy_struct: hotelMetapolicyProps | null;
    metapolicy_extra_info: string | null;
    /** Free-text policy sections from ETG; paragraphs may contain HTML */
    policy_struct: hotelDescriptionProps[];
    /** e.g. "visa", "mastercard", "cash" */
    payment_methods: string[];
    room_groups: hotelRoomGroupProps[];
    serp_filters: string[];
    facts: hotelFactsProps | null;
}

export type hotelRatesProps = {
    hid: number;
    search: HotelStaySummary;
    rates: HotelRate[];
    fetched_at: string;
    expires_at: string;
}

export type hotelPrebookProps = {
    id: string;
    hid: number;
    hotel_name: string | null;
    book_hash: string;
    price_changed: boolean;
    original_amount: number | null;
    amount: number;
    currency: string;
    checkin: string;
    checkout: string;
    residency: string;
    guests: HotelGuestRoom[];
    rate: HotelRate;
    expires_at: string;
    created_at: string;
    is_expired?: boolean;
}

export type hotelBookingStatus = 'awaiting_payment' | 'payment_declined' | 'booking' | 'confirmed' | 'failed' | 'needs_attention' | 'cancelled';

export type hotelBookingGuest = {
    first_name: string;
    last_name: string;
    is_child: boolean;
    age?: number;
}

export type hotelBookingTransaction = {
    id: string;
    txid: string;
    tx_type: string;
    payment_type: string;
    payment_status: string;
    decline_reason: string | null;
    amount: number;
    currency: string;
    payment_url: string | null;
    upload_url: string | null;
}

export type hotelBookingCancellation = {
    reason: string | null;
    penalty: number;
    refund: number;
    currency: string;
    amount_sell?: { amount: number; currency: string } | null;
}

export type hotelBookingProps = {
    id: string;
    reference: string;
    status: hotelBookingStatus;
    failure_reason: string | null;
    hid: number;
    hotel_name: string;
    hotel_address: string | null;
    region_name: string | null;
    checkin: string;
    checkout: string;
    nights: number;
    residency: string;
    guests: HotelGuestRoom[];
    rooms: { guests: hotelBookingGuest[] }[];
    room_name: string | null;
    meal: string | null;
    rate: HotelRate | null;
    free_cancellation_before: string | null;
    contact: { first_name: string; last_name: string; email: string; phone: string };
    comment: string | null;
    amount: number;
    discount: number;
    currency: string;
    voucher_code: string | null;
    hotel_confirmation_number: string | null;
    cancellation: hotelBookingCancellation | null;
    has_voucher: boolean;
    confirmed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    transaction: hotelBookingTransaction | null;
}

export type hotelBookingEvent = { at: string; event: string; detail: Record<string, unknown> | null }

export type hotelAdminBookingProps = hotelBookingProps & {
    etg_status: string | null;
    partner_order_id: string | null;
    partner_order_ids: string[];
    etg_order_id: number | null;
    etg_item_id: number | null;
    book_hash: string | null;
    supplier_confirmation_id: string | null;
    net_amount: number;
    net_currency: string;
    contract_amount: number | null;
    contract_currency: string | null;
    exchange_rate: number;
    markup: { type: string; value: number; vat: number } | null;
    etg_payment_type: string | null;
    order_info: Record<string, any> | null;
    events: hotelBookingEvent[];
    transaction_id: string | null;
    prebook_id: string | null;
    booking_started_at: string | null;
    status_checked_at: string | null;
    failed_at: string | null;
    updated_at: string;
    payment?: { status: string; type: string; txid: string; has_proof: boolean } | null;
}

export type hotelAdminBookingsResponse = {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    status_counts: Partial<Record<hotelBookingStatus, number>>;
    data: hotelAdminBookingProps[];
}
