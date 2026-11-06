import { FiX } from 'react-icons/fi'
import { hotelKindLabels } from '~/routes/general/hotel-search/hotel-constants'
import { formatMoney, HotelMealLabels, humanizeSlug } from '~/routes/general/hotel-search/hotel-utils'
import type { HotelFilterReference, HotelMealCategory, HotelSearchFilters } from '~/routes/general/hotel-search/types'

type props = {
    value: HotelSearchFilters;
    reference?: HotelFilterReference;
    currency?: string;
    onChange: (value: HotelSearchFilters) => void;
}

type Chip = { key: string; label: string; remove: () => HotelSearchFilters }

/** One removable chip per active filter, shown above the results */
export default function ActiveFilters(props: props) {
    const filters = props.value
    const amenity = new Map(props.reference?.serp_filters.map((item) => [item.value, item.desc]))
    const without = <K extends keyof HotelSearchFilters>(key: K, item: unknown) =>
        ({ ...filters, [key]: (filters[key] as unknown[]).filter((value) => value !== item) })
    const money = (amount: number) => formatMoney(amount, props.currency).replace(/\.00$/, '')

    const chips: Chip[] = [
        ...(filters.name ? [{ key: 'name', label: `Name: ${filters.name}`, remove: () => ({ ...filters, name: undefined }) }] : []),
        ...(filters.price_min !== undefined || filters.price_max !== undefined ? [{
            key: 'price',
            label: filters.price_min !== undefined && filters.price_max !== undefined
                ? `${money(filters.price_min)} – ${money(filters.price_max)}`
                : filters.price_min !== undefined ? `From ${money(filters.price_min)}` : `Up to ${money(filters.price_max!)}`,
            remove: () => ({ ...filters, price_min: undefined, price_max: undefined }),
        }] : []),
        ...(filters.stars ?? []).map((star) => ({ key: `star-${star}`, label: star === 0 ? 'Unrated' : `${star} stars`, remove: () => without('stars', star) })),
        ...(filters.free_cancellation ? [{ key: 'free', label: 'Free cancellation', remove: () => ({ ...filters, free_cancellation: undefined }) }] : []),
        ...(filters.payment_types ?? []).map((type) => ({ key: `pay-${type}`, label: type === 'hotel' ? 'Pay at the hotel' : humanizeSlug(type), remove: () => without('payment_types', type) })),
        ...(filters.meals ?? []).map((meal) => ({ key: `meal-${meal}`, label: HotelMealLabels[meal as HotelMealCategory]?.label ?? meal, remove: () => without('meals', meal) })),
        ...(filters.serp_filters ?? []).map((value) => ({ key: `serp-${value}`, label: amenity.get(value) ?? humanizeSlug(value), remove: () => without('serp_filters', value) })),
        ...(filters.kinds ?? []).map((kind) => ({ key: `kind-${kind}`, label: hotelKindLabels[kind.toLowerCase()] ?? humanizeSlug(kind), remove: () => without('kinds', kind) })),
    ]

    if (chips.length === 0) return null
    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={() => props.onChange(chip.remove())}
                    aria-label={`Remove filter ${chip.label}`}
                    className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-white border border-gray-300 text-sm text-zinc-800 hover:border-zinc-500 cursor-pointer transition-colors">
                    {chip.label}
                    <FiX className="text-zinc-500" />
                </button>
            ))}
            {chips.length > 1 && (
                <button type="button" onClick={() => props.onChange({})} className="text-sm font-semibold text-primary hover:underline cursor-pointer px-1">
                    Clear all
                </button>
            )}
        </div>
    )
}
