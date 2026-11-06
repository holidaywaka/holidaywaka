import React from 'react';
import { RangeSlider } from '@mantine/core';
import { FilterSection } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';
import { formatMoney, plural } from '~/routes/general/hotel-search/hotel-utils';

type props = {
    bounds?: { min: number; max: number };
    currency?: string;
    nights?: number;
    min?: number;
    max?: number;
    onChange: (value: { price_min?: number; price_max?: number }) => void;
}

/** Total stay price (cheapest rate per property); a side dragged back to its bound is dropped from the request */
export default function HotelFilterPrice(props: props) {
    const floor = Math.floor(props.bounds?.min ?? 0);
    const ceil = Math.ceil(props.bounds?.max ?? 0);
    const low = Math.max(floor, props.min ?? floor);
    const high = Math.min(ceil, props.max ?? ceil);
    const [value, setValue] = React.useState<[number, number]>([low, high]);

    // Follow the URL (cleared filters, new search bounds)
    React.useEffect(() => { setValue([low, high]) }, [low, high]);

    if (!props.bounds || ceil <= floor) return null;
    const step = Math.max(1, Math.round((ceil - floor) / 100));
    const format = (amount: number) => formatMoney(amount, props.currency).replace(/\.00$/, '');
    const isActive = props.min !== undefined || props.max !== undefined;

    return (
        <FilterSection title="Price" selectedCount={isActive ? 1 : 0} onClear={() => props.onChange({})}>
            <div className="text-xs text-zinc-500">Total for {plural(props.nights ?? 1, 'night')}, lowest rate per property</div>
            <div className="flex items-center justify-between text-sm font-semibold text-zinc-900 tabular-nums">
                <span>{format(value[0])}</span>
                <span>{format(value[1])}</span>
            </div>
            <div className="px-1 pb-1">
                <RangeSlider
                    min={floor}
                    max={ceil}
                    step={step}
                    minRange={step}
                    value={value}
                    onChange={setValue}
                    onChangeEnd={([min, max]) => props.onChange({
                        price_min: min > floor ? min : undefined,
                        price_max: max < ceil ? max : undefined,
                    })}
                    label={null}
                    color="var(--color-primary)"
                    size="sm"
                    thumbSize={18}
                />
            </div>
        </FilterSection>
    )
}
