import dayjs from "dayjs";
import type { HotelGuestRoom, HotelMealCategory, HotelPaymentType, HotelRatePayment, HotelSearchFilters, HotelSort, HotelStay } from "~/routes/general/hotel-search/types";

// Mirrors the ETG search constraints enforced by the backend
export const HOTEL_LIMITS = {
    maxRooms: 9,
    maxAdults: 6,
    maxChildren: 4,
    maxChildAge: 17,
    maxNights: 30,
    maxDaysAhead: 730,
};

export const HOTEL_DATE_FORMAT = "YYYY-MM-DD";
export const DEFAULT_RESIDENCY = "ng";
/** Backend defaults: sent only when the visitor changes them */
export const HOTEL_PAGE_SIZE = 20;
export const DEFAULT_SORT: HotelSort = "price_asc";

export const HotelMealLabels: Record<HotelMealCategory, { label: string; short: string }> = {
    no_meal: { label: "Room only", short: "RO" },
    breakfast: { label: "Breakfast included", short: "BB" },
    half_board: { label: "Half board (breakfast + lunch or dinner)", short: "HB" },
    full_board: { label: "Full board (breakfast, lunch and dinner)", short: "FB" },
    all_inclusive: { label: "All inclusive", short: "AI" },
    other: { label: "Other meal plans", short: "Other" },
};

export const HotelPaymentLabels: Record<HotelPaymentType, string> = {
    now: "Pay now",
    deposit: "Pay now",
    hotel: "Pay at the hotel",
};

export const HotelSortOptions: { value: HotelSort; label: string }[] = [
    { value: "price_asc", label: "Lowest price first" },
    { value: "price_desc", label: "Highest price first" },
    { value: "stars_desc", label: "Star rating" },
];

/** "has_airport_transfer" -> "Airport transfer" */
export function humanizeSlug(value: string | null | undefined) {
    if (!value) return "";
    const text = value.replace(/^has_/, "").replace(/[_-]+/g, " ").trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function hotelImageUrl(url: string | undefined, size = "640x400") {
    return url?.replace("{size}", size);
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
    if (amount === null || amount === undefined || !Number.isFinite(amount)) return "";
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(amount);
    } catch {
        return `${amount.toLocaleString()} ${currency ?? ""}`.trim();
    }
}

export function nightsBetween(checkin: string, checkout: string) {
    return dayjs(checkout).diff(dayjs(checkin), "day");
}

export function guestsCount(guests: HotelGuestRoom[]) {
    return guests.reduce((total, room) => total + room.adults + room.children.length, 0);
}

export function plural(count: number, word: string) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function staySummaryText(stay: Pick<HotelStay, "checkin" | "checkout" | "guests">) {
    const nights = nightsBetween(stay.checkin, stay.checkout);
    return `${plural(stay.guests.length, "room")} for ${plural(guestsCount(stay.guests), "guest")} | ${plural(nights, "night")}`;
}

/** Free cancellation deadlines are UTC; shown in the visitor's local time */
export function freeCancellationText(payment: Pick<HotelRatePayment, "free_cancellation_before">) {
    const before = payment.free_cancellation_before;
    if (!before || dayjs(before).isBefore(dayjs())) return null;
    return `Free cancellation before ${dayjs(before).format("MMM D, YYYY h:mm A")}`;
}

// ------------------------------------------------------------------ URL <-> stay

/** Rooms are separated by ";", each room is "adults" or "adults:age,age" e.g. "2:5,7;1" */
export function encodeGuests(guests: HotelGuestRoom[]) {
    return guests
        .map((room) => (room.children.length ? `${room.adults}:${room.children.join(",")}` : `${room.adults}`))
        .join(";");
}

export function decodeGuests(value: string | null): HotelGuestRoom[] | null {
    if (!value) return null;
    const rooms = value.split(";").map((room) => {
        const [adults, children] = room.split(":");
        return {
            adults: Number(adults),
            children: children ? children.split(",").filter(Boolean).map(Number) : [],
        };
    });
    const valid = rooms.length >= 1 && rooms.length <= HOTEL_LIMITS.maxRooms && rooms.every((room) =>
        Number.isInteger(room.adults) && room.adults >= 1 && room.adults <= HOTEL_LIMITS.maxAdults &&
        room.children.length <= HOTEL_LIMITS.maxChildren &&
        room.children.every((age) => Number.isInteger(age) && age >= 0 && age <= HOTEL_LIMITS.maxChildAge)
    );
    return valid ? rooms : null;
}

export function validateStayDates(checkin: string | null, checkout: string | null): string | null {
    if (!checkin || !checkout) return "Select your check-in and check-out dates";
    const start = dayjs(checkin, HOTEL_DATE_FORMAT);
    const end = dayjs(checkout, HOTEL_DATE_FORMAT);
    if (!start.isValid() || !end.isValid()) return "Select valid dates";
    if (start.isBefore(dayjs().startOf("day"))) return "Check-in date cannot be in the past";
    if (start.diff(dayjs().startOf("day"), "day") > HOTEL_LIMITS.maxDaysAhead) return "Check-in must be within the next 2 years";
    const nights = end.diff(start, "day");
    if (nights < 1) return "Check-out must be after check-in";
    if (nights > HOTEL_LIMITS.maxNights) return `A stay cannot be longer than ${HOTEL_LIMITS.maxNights} nights`;
    return null;
}

export function defaultStay(): HotelStay {
    return {
        checkin: dayjs().add(14, "day").format(HOTEL_DATE_FORMAT),
        checkout: dayjs().add(16, "day").format(HOTEL_DATE_FORMAT),
        residency: DEFAULT_RESIDENCY,
        guests: [{ adults: 2, children: [] }],
    };
}

/** Returns null when the URL does not describe a searchable stay */
export function readStay(params: URLSearchParams): HotelStay | null {
    const checkin = params.get("checkin");
    const checkout = params.get("checkout");
    const guests = decodeGuests(params.get("guests"));
    const residency = params.get("residency")?.toLowerCase() || DEFAULT_RESIDENCY;
    if (validateStayDates(checkin, checkout) || !guests || !/^[a-z]{2}$/.test(residency)) return null;
    return { checkin: checkin!, checkout: checkout!, guests, residency };
}

export function writeStay(params: URLSearchParams, stay: HotelStay) {
    params.set("checkin", stay.checkin);
    params.set("checkout", stay.checkout);
    params.set("guests", encodeGuests(stay.guests));
    params.set("residency", stay.residency);
    return params;
}

const listParam = (params: URLSearchParams, key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];

const isEmptyValue = (value: unknown) =>
    value === undefined || value === null || value === "" || value === false || (Array.isArray(value) && value.length === 0);

/** Drops empty values (undefined, null, "", false, []) so API payloads only carry the fields in use */
export function compact<T extends object>(value: T): Partial<T> {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => !isEmptyValue(item))) as Partial<T>;
}

/** "120-480" -> { price_min: 120, price_max: 480 }; either side may be omitted ("-480", "120-") */
function readPriceParam(value: string | null) {
    const [min, max] = (value ?? "").split("-").map((part) => (part === "" ? undefined : Number(part)));
    const valid = (amount: number | undefined) => (amount !== undefined && Number.isFinite(amount) && amount >= 0 ? amount : undefined);
    return { price_min: valid(min), price_max: valid(max) };
}

/** Only the filters present in the URL, so query keys and payloads stay minimal */
export function readSearchFilters(params: URLSearchParams): HotelSearchFilters {
    return compact({
        name: params.get("name")?.trim(),
        stars: listParam(params, "stars").map(Number).filter((star) => Number.isInteger(star)),
        kinds: listParam(params, "kinds"),
        meals: listParam(params, "meals"),
        serp_filters: listParam(params, "amenities"),
        payment_types: listParam(params, "payment"),
        free_cancellation: params.get("free_cancellation") === "1",
        ...readPriceParam(params.get("price")),
    });
}

export function activeFilterCount(filters: HotelSearchFilters) {
    const { price_min, price_max, ...rest } = filters;
    const lists = Object.values(compact(rest)).reduce<number>((total, value) => total + (Array.isArray(value) ? value.length : 1), 0);
    return lists + (price_min !== undefined || price_max !== undefined ? 1 : 0);
}

/** Rooms without children are sent as `{ adults }` only */
const compactGuests = (guests: HotelGuestRoom[]) => guests.map((room) => compact(room));

/** Stay fields for hotelpage / prebook requests, without unset optional fields */
export function stayPayload(stay: HotelStay, viewerCountry: string | null) {
    return compact({
        checkin: stay.checkin,
        checkout: stay.checkout,
        residency: stay.residency,
        guests: compactGuests(stay.guests),
        viewer_country: viewerCountry,
    });
}

/** SERP request body: defaults (first page, lowest price sort, no filters) are left to the backend */
export function searchPayload(regionId: number, stay: HotelStay, viewerCountry: string | null, filters: HotelSearchFilters, sort: HotelSort, page: number) {
    const activeFilters = compact(filters);
    return {
        region_id: regionId,
        ...stayPayload(stay, viewerCountry),
        ...(Object.keys(activeFilters).length ? { filters: activeFilters } : {}),
        ...(sort !== DEFAULT_SORT ? { sort } : {}),
        ...(page > 1 ? { page } : {}),
    };
}

export function writeSearchFilters(params: URLSearchParams, filters: HotelSearchFilters) {
    const setList = (key: string, values?: (string | number)[]) => {
        if (values?.length) params.set(key, values.join(","));
        else params.delete(key);
    };
    if (filters.name?.trim()) params.set("name", filters.name.trim());
    else params.delete("name");
    setList("stars", filters.stars);
    setList("kinds", filters.kinds);
    setList("meals", filters.meals);
    setList("amenities", filters.serp_filters);
    setList("payment", filters.payment_types);
    if (filters.free_cancellation) params.set("free_cancellation", "1");
    else params.delete("free_cancellation");
    if (filters.price_min !== undefined || filters.price_max !== undefined) params.set("price", `${filters.price_min ?? ""}-${filters.price_max ?? ""}`);
    else params.delete("price");
    return params;
}

export function hotelSearchLink(regionId: number, stay: HotelStay, filters: HotelSearchFilters = {}) {
    const params = writeSearchFilters(writeStay(new URLSearchParams({ region: String(regionId) }), stay), filters);
    return `/hotel-search?${params.toString()}`;
}

export function hotelPageLink(hid: number, stay: HotelStay | null) {
    const params = new URLSearchParams({ hid: String(hid) });
    if (stay) writeStay(params, stay);
    return `/hotel-page?${params.toString()}`;
}
