import { Popover } from '@mantine/core'
import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@mantine/hooks'
import { Building, Location, Star1 } from 'iconsax-reactjs'
import { createResponse, NewApis } from '~/services/new-apis'
import { ApiCountries } from '~/components/general/ApiCountries'
import type { HotelDestination as HotelDestinationValue, HotelDestinationsResponse, HotelPopularDestinationsResponse } from '~/routes/general/hotel-search/types'
import { humanizeSlug, plural } from '~/routes/general/hotel-search/hotel-utils'
import { useViewerCountry } from '~/routes/general/hotel-search/use-viewer-country'
import { FieldTrigger, GroupHeading, Highlight, SearchInput, useListNavigation } from './search-field'

type props = {
    value: HotelDestinationValue | null;
    onChange: (value: HotelDestinationValue | null) => void;
    error?: React.ReactNode;
}

const countryName = (code: string | null | undefined) =>
    code ? ApiCountries.find((country) => country.code === code.toUpperCase())?.name ?? code.toUpperCase() : null

type Option =
    | { kind: 'region'; value: HotelDestinationValue; region: HotelDestinationsResponse['regions'][number] }
    | { kind: 'hotel'; value: HotelDestinationValue; hotel: HotelDestinationsResponse['hotels'][number] }

export default function HotelDestination(props: props) {
    const [opened, setOpened] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [debounced] = useDebouncedValue(search.trim(), 300)
    const canSearch = debounced.length >= 2
    const viewerCountry = useViewerCountry()

    const results = useQuery<HotelDestinationsResponse>({
        queryKey: ['hotel-destination-search', debounced],
        queryFn: () => createResponse({ endpoint: `${NewApis.hotels.destinations}?q=${encodeURIComponent(debounced)}` }),
        enabled: canSearch,
        staleTime: 5 * 60 * 1000,
    })

    // Shown before the visitor types, so the list is never empty
    const popular = useQuery<HotelPopularDestinationsResponse>({
        queryKey: ['hotel-popular-destinations', viewerCountry],
        queryFn: () => createResponse({ endpoint: `${NewApis.hotels.popular_destinations}${viewerCountry ? `?country=${viewerCountry}` : ''}` }),
        enabled: opened,
        staleTime: 30 * 60 * 1000,
    })

    const active = canSearch ? results : popular
    const data = active.data

    // Flat list in display order, so keyboard navigation follows what is on screen
    const options = React.useMemo<Option[]>(() => [
        ...(data?.regions ?? []).map((region) => ({
            kind: 'region' as const,
            region,
            value: { type: 'region' as const, id: region.id, name: region.name, country_code: region.country_code },
        })),
        ...(data?.hotels ?? []).map((hotel) => ({
            kind: 'hotel' as const,
            hotel,
            value: { type: 'hotel' as const, id: hotel.hid, name: hotel.name, country_code: hotel.country_code, region_name: hotel.region_name },
        })),
    ], [data])

    function close() {
        setOpened(false)
        setSearch("")
    }

    function select(option: Option) {
        props.onChange(option.value)
        close()
    }

    const nav = useListNavigation(options, select, close, 'hotel-destination')
    const regionCount = data?.regions.length ?? 0
    const isEmpty = !active.isLoading && data && options.length === 0
    const popularCountry = countryName(popular.data?.country_code)
    const regionHeading = canSearch ? 'Destinations' : popularCountry ? `Popular in ${popularCountry}` : 'Popular destinations'
    const hotelHeading = canSearch ? 'Hotels' : popularCountry ? `Top-rated hotels in ${popularCountry}` : 'Top-rated hotels'

    const selectedDetail = props.value
        ? [props.value.type === 'hotel' ? props.value.region_name : null, countryName(props.value.country_code)].filter(Boolean).join(', ')
        : null

    return (
        <Popover opened={opened} onChange={(next) => next ? setOpened(true) : close()} width="target" position="bottom-start" shadow="md" trapFocus={false}>
            <Popover.Target>
                <div>
                    <FieldTrigger
                        label="Destination"
                        icon={props.value?.type === 'hotel' ? <Building className="size-5" /> : <Location className="size-5" />}
                        value={props.value ? (
                            <>
                                {props.value.name}
                                {selectedDetail && <span className="text-sm font-normal text-zinc-500">, {selectedDetail}</span>}
                            </>
                        ) : undefined}
                        placeholder="City, region or hotel"
                        opened={opened}
                        error={props.error}
                        onToggle={() => opened ? close() : setOpened(true)}
                        onClear={() => props.onChange(null)}
                    />
                </div>
            </Popover.Target>
            <Popover.Dropdown styles={{ dropdown: { padding: 0, maxWidth: "calc(100vw - 16px)", minWidth: "min(320px, calc(100vw - 16px))" } }}>
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    onKeyDown={nav.onKeyDown}
                    placeholder="Search a city, region or hotel"
                    label="Search destinations and hotels"
                    listId="hotel-destination-list"
                    activeId={nav.activeId}
                />
                <div id="hotel-destination-list" role="listbox" aria-label="Destinations and hotels" className="p-1 h-fit max-h-80 overflow-x-hidden overflow-y-auto scrolls">
                    {active.isLoading && (
                        <div className="p-2"><Skeleton count={4} height={44} className="mb-1" /></div>
                    )}
                    {active.isError && <div className="text-sm text-red-600 p-3">We couldn't load destinations right now. Please try again.</div>}
                    {isEmpty && (
                        <div className="p-4 text-center text-sm text-zinc-500">
                            {canSearch ? <>No destination or hotel matches <span className="font-semibold text-zinc-700">"{debounced}"</span>. Check the spelling or try a nearby city.</> : 'Start typing a city or hotel name'}
                        </div>
                    )}
                    {!canSearch && search.trim().length === 1 && <div className="text-xs text-zinc-500 px-3 py-2">Type at least 2 characters to search</div>}

                    {options.map((option, index) => (
                        <React.Fragment key={option.kind === 'region' ? `region-${option.region.id}` : `hotel-${option.hotel.hid}`}>
                            {index === 0 && regionCount > 0 && <GroupHeading>{regionHeading}</GroupHeading>}
                            {index === regionCount && option.kind === 'hotel' && <GroupHeading>{hotelHeading}</GroupHeading>}
                            <div
                                id={nav.optionId(index)}
                                role="option"
                                aria-selected={nav.active === index}
                                onMouseEnter={() => nav.setActive(index)}
                                onClick={() => select(option)}
                                className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${nav.active === index ? 'bg-slate-100' : ''}`}>
                                {option.kind === 'region'
                                    ? <RegionOption region={option.region} term={canSearch ? debounced : ''} />
                                    : <HotelOption hotel={option.hotel} term={canSearch ? debounced : ''} />}
                            </div>
                        </React.Fragment>
                    ))}
                    {canSearch && active.isFetching && !active.isLoading && <div className="text-xs text-zinc-500 px-3 py-1">Updating results...</div>}
                </div>
            </Popover.Dropdown>
        </Popover>
    )
}

function RegionOption({ region, term }: { region: HotelDestinationsResponse['regions'][number]; term: string }) {
    const detail = [region.type ? humanizeSlug(region.type) : null, countryName(region.country_code)].filter(Boolean).join(' · ')
    return (
        <>
            <span className="shrink-0 size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Location className="size-5" /></span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900 truncate"><Highlight text={region.name} term={term} /></span>
                {detail && <span className="block text-xs text-zinc-500 truncate">{detail}</span>}
            </span>
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{plural(region.hotels_count, 'property')}</span>
        </>
    )
}

function HotelOption({ hotel, term }: { hotel: HotelDestinationsResponse['hotels'][number]; term: string }) {
    const detail = hotel.address ?? [hotel.region_name, countryName(hotel.country_code)].filter(Boolean).join(', ')
    return (
        <>
            <span className="shrink-0 size-9 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center"><Building className="size-5" /></span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900 truncate"><Highlight text={hotel.name} term={term} /></span>
                {detail && <span className="block text-xs text-zinc-500 truncate">{detail}</span>}
            </span>
            {hotel.star_rating > 0 && (
                <span className="shrink-0 inline-flex items-center gap-0.5 text-xs text-zinc-600 tabular-nums" aria-label={`${hotel.star_rating} stars`}>
                    {hotel.star_rating}<Star1 variant="Bold" className="size-3.5 text-amber-500" />
                </span>
            )}
        </>
    )
}
