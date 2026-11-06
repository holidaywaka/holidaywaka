import React from 'react'
import { Popover } from '@mantine/core'
import Skeleton from 'react-loading-skeleton'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@mantine/hooks'
import { Airplane, Car, Location } from 'iconsax-reactjs'
import type { findplaceProps, transportNodesProps } from 'global'
import { Apis, Get } from '~/services/apis'
import { PickupOptions } from '~/components/utils'
import { FieldTrigger, Highlight, SearchInput, useListNavigation } from '~/routes/general/home/components/hotels/partials/search-field'

export type TransferPlace = {
    id: string
    title: string
    detail: string
    /** Country of an airport, or the address of a place; sent as start_country for the drop off search */
    country: string
    airport: boolean
}

type PlaceOption = transportNodesProps & findplaceProps

/**
 * origin: airports first, falling back to any place.
 * destination: places reachable from the chosen origin.
 * place: any place (chauffeur pick up).
 */
type Mode = 'origin' | 'destination' | 'place'

type props = {
    mode: Mode
    label: string
    placeholder: string
    value: TransferPlace | null
    onChange: (value: TransferPlace | null) => void
    error?: React.ReactNode
    /** Origin place id and country, required for the destination search */
    origin?: string | null
    start_country?: string | null
    /** Shown instead of the search when the field cannot be used yet */
    disabledReason?: string
}

function toPlace(item: PlaceOption): TransferPlace {
    const airport = Boolean(item.airportStart && item.iata)
    return {
        id: `${item.place_id}`,
        title: `${item.address}`,
        detail: airport ? [item.city, item.country, item.iata].filter(Boolean).join(' · ') : `${item.sub_name ?? ''}`,
        country: `${airport ? item.country : item.address}`,
        airport,
    }
}

export default function TransferPlaceField(props: props) {
    const [opened, setOpened] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [debounced] = useDebouncedValue(search.trim(), 400)
    const canSearch = debounced.length >= 2 && !props.disabledReason

    const { data, isLoading, isFetching, isError } = useQuery<PlaceOption[]>({
        queryKey: ['transfer-place-search', props.mode, debounced, props.origin, props.start_country],
        queryFn: async () => {
            const term = encodeURIComponent(debounced)
            if (props.mode === 'destination') {
                const response = await Get(`${Apis.iway.find_place}?term=${term}&place_id=${props.origin}&start_country=${props.start_country ?? ''}`)
                return response.map((el: findplaceProps) => ({ ...el, airportStart: false }))
            }
            if (props.mode === 'origin') {
                const nodes = await Get(`${Apis.iway.transport_nodes}?term=${term}`)
                if (Array.isArray(nodes) && nodes.length > 0) return nodes.map((el: transportNodesProps) => ({ ...el, airportStart: true }))
            }
            const places = await Get(`${Apis.iway.find_place}?term=${term}`)
            return places.map((el: findplaceProps) => ({ ...el, airportStart: false }))
        },
        enabled: canSearch,
        staleTime: 60 * 1000,
    })

    const options = React.useMemo(() => canSearch ? data ?? [] : [], [canSearch, data])

    function close() {
        setOpened(false)
        setSearch("")
    }

    function select(item: PlaceOption) {
        props.onChange(toPlace(item))
        close()
    }

    const nav = useListNavigation(options, select, close, `transfer-${props.mode}`)
    const listId = `transfer-${props.mode}-list`
    const icon = props.value?.airport ? <Airplane className="size-5" /> : props.mode === 'place' ? <Car className="size-5" /> : <Location className="size-5" />

    return (
        <Popover opened={opened} onChange={(next) => next ? setOpened(true) : close()} width="target" position="bottom-start" shadow="md" trapFocus={false}>
            <Popover.Target>
                <div>
                    <FieldTrigger
                        label={props.label}
                        icon={icon}
                        value={props.value ? (
                            <>
                                {props.value.title}
                                {props.value.detail && <span className="block text-xs font-normal text-zinc-500 truncate">{props.value.detail}</span>}
                            </>
                        ) : undefined}
                        placeholder={props.placeholder}
                        opened={opened}
                        error={props.error}
                        onToggle={() => opened ? close() : setOpened(true)}
                        onClear={() => props.onChange(null)}
                    />
                </div>
            </Popover.Target>
            <Popover.Dropdown styles={{ dropdown: { padding: 0, maxWidth: "calc(100vw - 16px)", minWidth: "min(320px, calc(100vw - 16px))" } }}>
                {props.disabledReason ? (
                    <div className="p-4 text-center text-sm text-zinc-500">{props.disabledReason}</div>
                ) : <>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        onKeyDown={nav.onKeyDown}
                        placeholder={props.mode === 'destination' ? 'Address, hotel, airport...' : 'Airport, hotel, address...'}
                        label={`Search ${props.label.toLowerCase()} location`}
                        listId={listId}
                        activeId={nav.activeId}
                    />
                    <div id={listId} role="listbox" aria-label={`${props.label} locations`} className="p-1 h-fit max-h-80 overflow-x-hidden overflow-y-auto scrolls">
                        {!canSearch && (
                            <div className="p-4 text-center text-sm text-zinc-500">
                                {search.trim().length === 1 ? 'Type at least 2 characters to search' : props.mode === 'origin' ? 'Start typing an airport, city or address' : 'Start typing a hotel, address or airport'}
                            </div>
                        )}
                        {canSearch && isLoading && <div className="p-2"><Skeleton count={4} height={44} className="mb-1" /></div>}
                        {canSearch && isError && <div className="text-sm text-red-600 p-3">We couldn't load locations right now. Please try again.</div>}
                        {canSearch && !isLoading && !isError && options.length === 0 && (
                            <div className="p-4 text-center text-sm text-zinc-500">
                                No location matches <span className="font-semibold text-zinc-700">"{debounced}"</span>. Try a nearby airport or a fuller address.
                            </div>
                        )}
                        {options.map((item, index) => (
                            <div
                                key={`${item.place_id}-${index}`}
                                id={nav.optionId(index)}
                                role="option"
                                aria-selected={nav.active === index}
                                onMouseEnter={() => nav.setActive(index)}
                                onClick={() => select(item)}
                                className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${nav.active === index ? 'bg-slate-100' : ''}`}>
                                <span className={`shrink-0 size-9 rounded-md flex items-center justify-center ${item.airportStart ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-600'}`}>
                                    {item.airportStart ? <Airplane className="size-5" /> : <Location className="size-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-zinc-900 truncate"><Highlight text={`${item.address ?? ''}`} term={debounced} /></span>
                                    <span className="block text-xs text-zinc-500 truncate">
                                        {item.airportStart ? [item.city, item.country].filter(Boolean).join(', ') : item.sub_name}
                                    </span>
                                </span>
                                {item.airportStart && item.iata && <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">{item.iata}</span>}
                            </div>
                        ))}
                        {canSearch && isFetching && !isLoading && <div className="text-xs text-zinc-500 px-3 py-1">Updating results...</div>}
                    </div>
                </>}
            </Popover.Dropdown>
        </Popover>
    )
}

/** Transfer / Chauffeur switch shared by the home card and the transfer search page */
export function TransferModeTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const descriptions: Record<string, string> = {
        [PickupOptions.TRANSFER]: 'Point to point ride',
        [PickupOptions.CHAUFFEUR]: 'Driver by the hour',
    }
    return (
        <div role="tablist" aria-label="Transfer type" className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-zinc-100">
            {Object.values(PickupOptions).map((item) => {
                const active = value === item
                return (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        key={item}
                        onClick={() => onChange(item)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-left cursor-pointer transition-all active:scale-95 ${active ? 'bg-primary text-white shadow-sm' : 'text-zinc-700 hover:bg-white'}`}>
                        <span className={`shrink-0 size-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-white' : 'border-zinc-400'}`}>
                            {active && <span className="size-1.5 rounded-full bg-white" />}
                        </span>
                        <span>
                            <span className="block text-sm font-bold capitalize leading-tight">{item}</span>
                            <span className={`block text-[11px] leading-tight ${active ? 'text-white/75' : 'text-zinc-500'}`}>{descriptions[item]}</span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
