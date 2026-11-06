/**
 * Maps ETG rate objects (search/serp, search/hp, hotel/prebook) to the compact
 * shape served to the frontend. Amounts are converted to numbers; everything the
 * guest must be shown before booking (cancellation, taxes payable at the hotel,
 * deposit, no-show) is preserved.
 */

const toAmount = (value) => {
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : null
}

// ETG cancellation timestamps are UTC±0 but sent without a zone ("2027-02-21T00:00:00")
const toUtcIso = (value) => {
    if (!value) return null
    return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
}

export const MealCategories = {
    no_meal: "no_meal",
    breakfast: "breakfast",
    half_board: "half_board",
    full_board: "full_board",
    all_inclusive: "all_inclusive",
    other: "other",
}

// ETG has many meal variants (breakfast-buffet, half-board-dinner, soft-all-inclusive...).
// Group them into the categories the UI filters on.
export function mealCategory(value) {
    if (!value || value === "nomeal") return MealCategories.no_meal
    if (value.includes("all-inclusive")) return MealCategories.all_inclusive
    if (value.startsWith("full-board")) return MealCategories.full_board
    if (value.startsWith("half-board")) return MealCategories.half_board
    if (value.includes("breakfast")) return MealCategories.breakfast
    return MealCategories.other
}

function normalizePaymentType(payment) {
    const penalties = payment?.cancellation_penalties ?? {}
    const taxes = (payment?.tax_data?.taxes ?? []).map((tax) => ({
        name: tax.name,
        amount: toAmount(tax.amount),
        currency: tax.currency_code,
        // false => paid by the guest at the hotel, in `currency`
        included_by_supplier: Boolean(tax.included_by_supplier),
    }))
    const vat = payment?.vat_data && toAmount(payment.vat_data.amount)
        ? {
            included: Boolean(payment.vat_data.included),
            applied: Boolean(payment.vat_data.applied),
            amount: toAmount(payment.vat_data.amount),
            currency: payment.vat_data.currency_code,
        }
        : null

    return {
        type: payment?.type ?? null,
        amount: toAmount(payment?.amount),
        currency: payment?.currency_code ?? null,
        show_amount: toAmount(payment?.show_amount),
        show_currency: payment?.show_currency_code ?? null,
        by: payment?.by ?? null,
        is_need_credit_card_data: Boolean(payment?.is_need_credit_card_data),
        is_need_cvc: Boolean(payment?.is_need_cvc),
        free_cancellation_before: toUtcIso(penalties.free_cancellation_before),
        cancellation_policies: (penalties.policies ?? []).map((policy) => ({
            start_at: toUtcIso(policy.start_at),
            end_at: toUtcIso(policy.end_at),
            amount_show: toAmount(policy.amount_show),
            amount_charge: toAmount(policy.amount_charge),
        })),
        taxes,
        vat,
        perks: payment?.perks ?? {},
    }
}

export function hasFreeCancellation(payment, now = Date.now()) {
    const before = payment?.free_cancellation_before
    return Boolean(before) && new Date(before).getTime() > now
}

export function normalizeRate(rate) {
    const paymentTypes = (rate?.payment_options?.payment_types ?? []).map(normalizePaymentType)
    // Primary option = cheapest for the guest
    const payment = paymentTypes.reduce(
        (cheapest, item) => (cheapest === null || (item.show_amount ?? Infinity) < (cheapest.show_amount ?? Infinity) ? item : cheapest),
        null
    )
    const meal = rate?.meal_data?.value ?? rate?.meal ?? null
    const room = rate?.room_data_trans ?? {}

    return {
        book_hash: rate?.book_hash ?? null,
        search_hash: rate?.search_hash ?? null,
        match_hash: rate?.match_hash ?? null,
        room_name: rate?.room_name ?? room.main_name ?? null,
        room: {
            main_name: room.main_name ?? null,
            main_room_type: room.main_room_type ?? null,
            bedding_type: room.bedding_type ?? null,
            bathroom: room.bathroom ?? null,
            misc_room_type: room.misc_room_type ?? null,
            beds: room.beds ?? [],
        },
        rg_ext: rate?.rg_ext ?? null,
        amenities: rate?.amenities_data ?? [],
        meal: {
            value: meal,
            category: mealCategory(meal),
            has_breakfast: Boolean(rate?.meal_data?.has_breakfast),
            no_child_meal: Boolean(rate?.meal_data?.no_child_meal),
        },
        daily_prices: (rate?.daily_prices ?? []).map(toAmount),
        allotment: rate?.allotment ?? null,
        is_package: Boolean(rate?.is_package),
        any_residency: rate?.any_residency ?? true,
        payment,
        payment_types: paymentTypes,
        deposit: rate?.deposit
            ? { amount: toAmount(rate.deposit.amount), currency: rate.deposit.currency_code, is_refundable: Boolean(rate.deposit.is_refundable) }
            : null,
        no_show: rate?.no_show
            ? { amount: toAmount(rate.no_show.amount), currency: rate.no_show.currency_code, from_time: rate.no_show.from_time ?? null }
            : null,
        sell_price_limits: rate?.sell_price_limits ?? null,
        legal_info: rate?.legal_info ?? null,
    }
}
