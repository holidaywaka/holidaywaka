import { Star1 } from 'iconsax-reactjs';
import { FilterSection } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';

type props = {
    counts?: Record<string, number>;
    selected: number[];
    onChange: (selected: number[]) => void;
}

// ETG star_rating values 0-5; 0 means the property is unrated
export default function HotelFilterStars(props: props) {
    const options = Object.entries(props.counts ?? {})
        .map(([value, count]) => ({ value: Number(value), count }))
        .sort((a, b) => b.value - a.value);

    if (options.length === 0) return null;

    function toggle(value: number) {
        props.onChange(props.selected.includes(value) ? props.selected.filter((item) => item !== value) : [...props.selected, value]);
    }

    return (
        <FilterSection title="Star rating" selectedCount={props.selected.length} onClear={() => props.onChange([])}>
            <div className="grid grid-cols-3 gap-1.5">
                {options.map((item) => {
                    const isSelected = props.selected.includes(item.value);
                    return (
                        <button
                            key={item.value}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={item.value === 0 ? `Unrated, ${item.count} properties` : `${item.value} stars, ${item.count} properties`}
                            disabled={item.count === 0 && !isSelected}
                            onClick={() => toggle(item.value)}
                            className={`flex flex-col items-center justify-center rounded-md border py-1.5 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-45 ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-zinc-800 hover:border-zinc-400'}`}>
                            <span className="flex items-center gap-0.5 text-sm font-semibold">
                                {item.value === 0 ? 'Unrated' : <>{item.value}<Star1 variant="Bold" className={`size-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} /></>}
                            </span>
                            <span className={`text-[11px] tabular-nums ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>{item.count.toLocaleString()}</span>
                        </button>
                    )
                })}
            </div>
        </FilterSection>
    )
}
