import FilterCheckList, { countsToOptions } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';
import { serpFilterIcons } from '~/routes/general/hotel-search/hotel-constants';
import { humanizeSlug } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelFilterReference } from '~/routes/general/hotel-search/types';

type props = {
    counts?: Record<string, number>;
    reference?: HotelFilterReference;
    selected: string[];
    onChange: (selected: string[]) => void;
}

// Labels come from ETG filter_values (synced in step 1); hotels must offer every selected facility
export default function HotelFIlterAmenties(props: props) {
    const labels = new Map(props.reference?.serp_filters.map((item) => [item.value, item.desc]));
    const options = countsToOptions(props.counts, (value) => labels.get(value) ?? humanizeSlug(value), (value) => serpFilterIcons[value]);

    return <FilterCheckList title="Facilities" options={options} selected={props.selected} onChange={props.onChange} limit={6} />
}
