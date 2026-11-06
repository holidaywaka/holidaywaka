import HotelFIlterAmenties from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-amenities'
import HotelFilterKinds from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-kinds'
import HotelFilterMeal from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-meal'
import HotelFilterName from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-name'
import HotelFilterPaymentCancellation from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-payment-cancellation'
import HotelFilterPrice from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-price'
import HotelFilterStars from '~/routes/general/hotel-search/hotel-filters/partials/hotel-filter-stars'
import { activeFilterCount } from '~/routes/general/hotel-search/hotel-utils'
import type { HotelFilterReference, HotelSearchFilterCounts, HotelSearchFilters } from '~/routes/general/hotel-search/types'

type props = {
  counts?: HotelSearchFilterCounts;
  reference?: HotelFilterReference;
  value: HotelSearchFilters;
  onChange: (value: HotelSearchFilters) => void;
  /** Currency and nights of the current results, for the price filter */
  currency?: string;
  nights?: number;
}

/** Filter groups follow the ETG search facets; counts come from the backend for the current stay */
export default function HotelFilters(props: props) {
  const update = (patch: Partial<HotelSearchFilters>) => props.onChange({ ...props.value, ...patch });
  const active = activeFilterCount(props.value);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="font-bold text-lg text-zinc-900">
          Filters{active > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs align-middle">{active}</span>}
        </div>
        {active > 0 && (
          <button type="button" onClick={() => props.onChange({})} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
            Clear all
          </button>
        )}
      </div>
      <HotelFilterName value={props.value.name} onChange={(name) => update({ name })} />
      <HotelFilterPrice
        bounds={props.counts?.price}
        currency={props.currency}
        nights={props.nights}
        min={props.value.price_min}
        max={props.value.price_max}
        onChange={(price) => update({ price_min: price.price_min, price_max: price.price_max })}
      />
      <HotelFilterStars counts={props.counts?.stars} selected={props.value.stars ?? []} onChange={(stars) => update({ stars })} />
      <HotelFilterPaymentCancellation
        counts={props.counts}
        freeCancellation={Boolean(props.value.free_cancellation)}
        paymentTypes={props.value.payment_types ?? []}
        onFreeCancellationChange={(free_cancellation) => update({ free_cancellation })}
        onPaymentTypesChange={(payment_types) => update({ payment_types })}
      />
      <HotelFilterMeal counts={props.counts?.meals} selected={props.value.meals ?? []} onChange={(meals) => update({ meals })} />
      <HotelFIlterAmenties counts={props.counts?.serp_filters} reference={props.reference} selected={props.value.serp_filters ?? []} onChange={(serp_filters) => update({ serp_filters })} />
      <HotelFilterKinds counts={props.counts?.kinds} selected={props.value.kinds ?? []} onChange={(kinds) => update({ kinds })} />
    </div>
  )
}
