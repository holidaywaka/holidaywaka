/** Shapes returned by the backend /hotels endpoints (ETG rates normalised server-side). */

export type HotelMealCategory = 'no_meal' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive' | 'other';
export type HotelPaymentType = 'now' | 'hotel' | 'deposit';
export type HotelSort = 'price_asc' | 'price_desc' | 'stars_desc';

export interface HotelGuestRoom {
  adults: number;
  children: number[];
}

export interface HotelStay {
  checkin: string;
  checkout: string;
  residency: string;
  guests: HotelGuestRoom[];
}

export interface HotelStaySummary extends HotelStay {
  currency: string;
  nights: number;
  rooms: number;
  total_guests: number;
}

export interface HotelRegion {
  id: number;
  name: string;
  type: string | null;
  country_code: string | null;
}

export interface HotelCancellationPolicy {
  start_at: string | null;
  end_at: string | null;
  amount_show: number | null;
  amount_charge: number | null;
}

export interface HotelRateTax {
  name: string;
  amount: number | null;
  currency: string;
  /** false => paid by the guest at the hotel */
  included_by_supplier: boolean;
}

export interface HotelRatePayment {
  type: HotelPaymentType;
  amount: number | null;
  currency: string | null;
  show_amount: number;
  show_currency: string;
  by: string | null;
  is_need_credit_card_data: boolean;
  is_need_cvc: boolean;
  free_cancellation_before: string | null;
  cancellation_policies: HotelCancellationPolicy[];
  taxes: HotelRateTax[];
  vat: { included: boolean; applied: boolean; amount: number | null; currency: string } | null;
  perks: Record<string, unknown>;
}

export interface HotelRateMeal {
  value: string | null;
  category: HotelMealCategory;
  has_breakfast: boolean;
  no_child_meal: boolean;
}

export interface HotelRate {
  book_hash: string | null;
  search_hash: string | null;
  match_hash: string | null;
  room_name: string | null;
  room: {
    main_name: string | null;
    main_room_type: string | null;
    bedding_type: string | null;
    bathroom: string | null;
    misc_room_type: string | null;
    beds: string[];
  };
  rg_ext: Record<string, number> | null;
  amenities: string[];
  meal: HotelRateMeal;
  daily_prices: (number | null)[];
  allotment: number | null;
  is_package: boolean;
  any_residency: boolean;
  payment: HotelRatePayment;
  payment_types: HotelRatePayment[];
  deposit: { amount: number | null; currency: string; is_refundable: boolean } | null;
  no_show: { amount: number | null; currency: string; from_time: string | null } | null;
  sell_price_limits: { min_price?: string; max_price?: string } | null;
  legal_info: unknown;
}

export interface HotelSearchHotel {
  hid: number;
  name: string;
  kind: string | null;
  star_rating: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  serp_filters: string[];
  min_price: number;
  currency: string;
  meals: HotelMealCategory[];
  has_free_cancellation: boolean;
  payment_types: HotelPaymentType[];
  rates_count: number;
  rates: {
    room_name: string | null;
    meal: HotelRateMeal;
    payment: Pick<HotelRatePayment, 'type' | 'show_amount' | 'show_currency' | 'free_cancellation_before'>;
  }[];
}

export interface HotelSearchFilterCounts {
  stars: Record<string, number>;
  kinds: Record<string, number>;
  meals: Record<string, number>;
  serp_filters: Record<string, number>;
  payment_types: Record<string, number>;
  free_cancellation: number;
  price: { min: number; max: number };
}

export interface HotelSearchFilters {
  name?: string;
  stars?: number[];
  kinds?: string[];
  meals?: string[];
  serp_filters?: string[];
  payment_types?: string[];
  free_cancellation?: boolean;
  /** Total stay price bounds, in the currency the results are shown in */
  price_min?: number;
  price_max?: number;
}

export interface HotelSearchResponse {
  search: HotelStaySummary & { region: HotelRegion };
  total_hotels: number;
  total_available: number;
  total_filtered: number;
  page: number;
  page_size: number;
  total_pages: number;
  filters: HotelSearchFilterCounts;
  hotels: HotelSearchHotel[];
  expires_at: string;
}

export interface HotelDestinationRegion {
  id: number;
  name: string;
  type: string | null;
  country_code: string | null;
  hotels_count: number;
}

export interface HotelDestinationHotel {
  hid: number;
  name: string;
  address: string | null;
  star_rating: number;
  region_id: number | null;
  region_name: string | null;
  country_code: string | null;
}

export interface HotelDestinationsResponse {
  regions: HotelDestinationRegion[];
  hotels: HotelDestinationHotel[];
}

export interface HotelPopularDestinationsResponse extends HotelDestinationsResponse {
  /** "country": suggestions from the visitor's country; "global": none held there, most stocked overall */
  scope: 'country' | 'global';
  country_code: string | null;
}

export type HotelDestination =
  | { type: 'region'; id: number; name: string; country_code: string | null }
  | { type: 'hotel'; id: number; name: string; country_code: string | null; region_name: string | null };

export interface HotelFilterReference {
  serp_filters: { value: string; desc: string }[];
  kinds: string[];
  star_ratings: number[];
  meals: { value: string; desc: string }[];
  room_amenities: { value: string; desc: string }[];
  taxes: { value: string; desc: string }[];
}
