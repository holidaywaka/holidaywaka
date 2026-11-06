import FilterCheckList, { countsToOptions } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';
import { HotelMealLabels } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelMealCategory } from '~/routes/general/hotel-search/types';

type props = {
    counts?: Record<string, number>;
    selected: string[];
    onChange: (selected: string[]) => void;
}

// Meal plans read better from least to most included than by frequency
const MEAL_ORDER = Object.keys(HotelMealLabels);

export default function HotelFilterMeal(props: props) {
    const options = countsToOptions(props.counts, (value) => HotelMealLabels[value as HotelMealCategory]?.label ?? value)
        .sort((a, b) => MEAL_ORDER.indexOf(a.value) - MEAL_ORDER.indexOf(b.value));
    return <FilterCheckList title="Meal plan" options={options} selected={props.selected} onChange={props.onChange} />
}
