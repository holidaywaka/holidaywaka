import { useDebouncedCallback } from '@mantine/hooks';
import React from 'react'
import { FiSearch, FiX } from 'react-icons/fi';
import { FilterSection } from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';

type props = {
    value?: string;
    onChange: (value: string) => void;
}

export default function HotelFilterName(props: props) {
    const [name, setName] = React.useState(props.value ?? '');
    const commit = useDebouncedCallback(props.onChange, 400);

    // Keep in sync when filters are cleared from outside
    React.useEffect(() => { setName(props.value ?? '') }, [props.value]);

    function update(value: string) {
        setName(value);
        commit(value);
    }

    return (
        <FilterSection title="Property name">
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <FiSearch className="shrink-0 text-zinc-500" />
                <input
                    type="text"
                    className="w-full min-w-0 outline-none text-sm! bg-transparent"
                    placeholder="e.g. Radisson"
                    aria-label="Filter by property name"
                    value={name}
                    onChange={(e) => update(e.target.value)} />
                {name && <button type="button" aria-label="Clear name" onClick={() => update('')} className="shrink-0 text-zinc-500 hover:text-zinc-900 cursor-pointer"><FiX /></button>}
            </div>
        </FilterSection>
    )
}
