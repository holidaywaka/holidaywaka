import React from 'react'
import { Popover } from '@mantine/core'
import Skeleton from 'react-loading-skeleton'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@mantine/hooks'
import { Airplane, Car, Location } from 'iconsax-reactjs'
import type { findplaceProps, transportNodesProps } from 'global'
import { Apis, Get } from '~/services/apis'
import { PickupOptions } from '~/components/utils'
import { DROPDOWN_POPOVER, FieldTrigger, GroupHeading, Highlight, SearchInput, useDropdownField, useListNavigation } from '~/routes/general/home/components/hotels/partials/search-field'

export type TransferPlace = {
    id: string
    title: string
    detail: string
    /** Country of an airport, or the address of a place; sent as start_country for the drop off search */
    country: string
    airport: boolean
}

type PlaceOption = transportNodesProps & findplaceProps

const airport = (address: string, place_id: string, city: string, country: string, iata: string) =>
    ({ address, place_id, city, country, iata, description: address, airportStart: true }) as unknown as PlaceOption

/** Shown before typing so the pick up list is never empty (ids as returned by the transfer supplier) */
const POPULAR_AIRPORTS: PlaceOption[] = [
    airport('Airport Murtala Muhammed International', 'ChIJhRTXUeeROxARmk_Rp3PtIvI', 'Lagos', 'Nigeria', 'LOS'),
    airport('Airport Nnamdi Azikiwe International', 'ChIJBV2qPJlwThARvViDvpFOwm0', 'Abuja', 'Nigeria', 'ABV'),
    airport('Airport Port Harcourt International Airport', 'ChIJJ7E-txvXaRARy4noSPrIAtI', 'Port Harcourt', 'Nigeria', 'PHC'),
    airport('Airport Dubai International', 'ChIJaQ4mkwZdXz4R6e5IegDUleY', 'Dubai', 'United Arab Emirates', 'DXB'),
    airport('Airport Heathrow', 'ChIJ6W3FzTRydkgRZ0H2Q1VT548', 'London', 'Great Britain', 'LHR'),
    airport('Airport Charles de Gaulle', 'ChIJW89MjgM-5kcRLKZbL5jgKwQ', 'Paris', 'France', 'CDG'),
    airport('Airport John F. Kennedy New York', 'ChIJR0lA1VBmwokR8BGfSBOyT-w', 'New York', 'USA', 'JFK'),
    airport('Airport OR Tambo International', 'ChIJwymiBTgUlR4R1iEoeUAcv7M', 'Johannesburg', 'South Africa', 'JNB'),
]

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
    /** Destination: city of the pick up, used to suggest drop off places before the guest types */
    suggestFrom?: string | null
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
    // Scrolls the field clear of the sticky header before opening, so the list always opens fully below it
    const { ref: fieldRef, opened, setOpened, open } = useDropdownField()
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

    // Before typing: popular airports (pick up) or places in the pick up's city (drop off)
    const suggestionsQuery = useQuery<PlaceOption[]>({
        queryKey: ['transfer-place-suggestions', props.origin, props.suggestFrom, props.start_country],
        queryFn: async () => {
            const lookup = (term: string) => Get(`${Apis.iway.find_place}?term=${encodeURIComponent(term)}&place_id=${props.origin}&start_country=${encodeURIComponent(props.start_country ?? '')}`)
                .then((response) => Array.isArray(response) ? response as findplaceProps[] : [])
                .catch(() => [] as findplaceProps[])
            // The city itself plus its hotels, the most common drop offs
            const results = (await Promise.all([lookup(props.suggestFrom ?? ''), lookup(`${props.suggestFrom} hotel`)])).flat()
            const country = String(props.start_country ?? '').toLowerCase()
            const seen = new Set<string>()
            const unique = results
                .map((el) => ({ ...el, airportStart: false }) as PlaceOption)
                .filter((el) => !seen.has(String(el.place_id)) && Boolean(seen.add(String(el.place_id))))
            // The search is global ("Lagos" also matches Portugal): keep places in the pick up's country. Country
            // names differ between the two supplier lists ("Great Britain" vs "UK"), so fall back when none match
            const local = unique.filter((el) => !country || String(el.description ?? '').toLowerCase().includes(country))
            return (local.length ? local : unique).slice(0, 8)
        },
        enabled: opened && props.mode === 'destination' && Boolean(props.origin && props.suggestFrom) && !props.disabledReason,
        staleTime: 10 * 60 * 1000,
    })
    const suggestions = React.useMemo<PlaceOption[]>(() => {
        if (props.mode === 'destination') return suggestionsQuery.data ?? []
        return POPULAR_AIRPORTS
    }, [props.mode, suggestionsQuery.data])
    const showingSuggestions = !canSearch && search.trim().length < 2

    const options = React.useMemo(() => canSearch ? data ?? [] : showingSuggestions ? suggestions : [], [canSearch, data, showingSuggestions, suggestions])

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
        <Popover opened={opened} onChange={(next) => next ? open() : close()} width="target" {...DROPDOWN_POPOVER}>
            <Popover.Target>
                <div ref={fieldRef}>
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
                        onToggle={() => opened ? close() : open()}
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
                        {showingSuggestions && suggestions.length > 0 && (
                            <GroupHeading>{props.mode === 'destination' ? `Popular in ${props.suggestFrom}` : 'Popular airports'}</GroupHeading>
                        )}
                        {showingSuggestions && props.mode === 'destination' && suggestionsQuery.isLoading && <div className="p-2"><Skeleton count={3} height={44} className="mb-1" /></div>}
                        {!canSearch && (search.trim().length === 1 || (suggestions.length === 0 && !suggestionsQuery.isLoading)) && (
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
                                className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${nav.active === index ? 'bg-primary/[0.06]' : ''}`}>
                                <span className={`shrink-0 size-9 rounded-md flex items-center justify-center ${item.airportStart ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-600'}`}>
                                    {item.airportStart ? <Airplane className="size-5" /> : <Location className="size-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-zinc-900 truncate"><Highlight text={`${item.address ?? ''}`.replace(/^Airport /, '')} term={debounced} /></span>
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
