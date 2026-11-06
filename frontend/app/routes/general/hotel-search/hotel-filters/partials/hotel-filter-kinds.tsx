import FilterCheckList, { countsToOptions } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';
import { hotelKindLabels } from '~/routes/general/hotel-search/hotel-constants';
import { humanizeSlug } from '~/routes/general/hotel-search/hotel-utils';

type props = {
    counts?: Record<string, number>;
    selected: string[];
    onChange: (selected: string[]) => void;
}

export default function HotelFilterKinds(props: props) {
    const options = countsToOptions(props.counts, (value) => hotelKindLabels[value.toLowerCase()] ?? humanizeSlug(value));
    return <FilterCheckList title="Property type" options={options} selected={props.selected} onChange={props.onChange} limit={6} />
}
