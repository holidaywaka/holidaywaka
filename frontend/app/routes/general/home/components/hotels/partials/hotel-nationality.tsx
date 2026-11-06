import { Popover } from '@mantine/core'
import React from 'react'
import { FiCheck } from 'react-icons/fi'
import { Global } from 'iconsax-reactjs'
import { ApiCountries } from '~/components/general/ApiCountries'
import { DEFAULT_RESIDENCY } from '~/routes/general/hotel-search/hotel-utils'
import { useViewerCountry } from '~/routes/general/hotel-search/use-viewer-country'
import { CountryFlag, FieldTrigger, GroupHeading, Highlight, SearchInput, useListNavigation } from './search-field'

type props = {
    /** ISO 3166-1 alpha-2, lowercase (ETG `residency`) */
    value: string;
    onChange: (value: string) => void;
}

type Country = (typeof ApiCountries)[number]

const byCode = (code: string | null | undefined) => code ? ApiCountries.find((country) => country.code.toLowerCase() === code.toLowerCase()) : undefined

export default function HotelNationality(props: props) {
    const [opened, setOpened] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const viewerCountry = useViewerCountry()
    const selected = byCode(props.value)
    const term = search.trim().toLowerCase()

    // Selected, visitor's and default countries first; the full list follows without them
    const suggested = React.useMemo(() => {
        const codes = [props.value, viewerCountry, DEFAULT_RESIDENCY].filter(Boolean).map((code) => code!.toLowerCase())
        return [...new Set(codes)].map(byCode).filter((country): country is Country => Boolean(country))
    }, [props.value, viewerCountry])

    const countries = React.useMemo(() => {
        if (term) {
            // Names starting with the term rank above other matches; codes match exactly
            return ApiCountries
                .filter((country) => country.name.toLowerCase().includes(term) || country.code.toLowerCase() === term)
                .sort((a, b) => Number(!a.name.toLowerCase().startsWith(term)) - Number(!b.name.toLowerCase().startsWith(term)))
        }
        const pinned = new Set(suggested.map((country) => country.code))
        return [...suggested, ...ApiCountries.filter((country) => !pinned.has(country.code))]
    }, [term, suggested])

    function close() {
        setOpened(false)
        setSearch("")
    }

    function select(country: Country) {
        props.onChange(country.code.toLowerCase())
        close()
    }

    const nav = useListNavigation(countries, select, close, 'hotel-nationality')
    const suggestedCount = term ? 0 : suggested.length

    return (
        <Popover opened={opened} onChange={(next) => next ? setOpened(true) : close()} width="target" position="bottom-start" shadow="md" trapFocus={false}>
            <Popover.Target>
                <div>
                    <FieldTrigger
                        label="Guest nationality"
                        icon={selected ? <CountryFlag code={selected.code} /> : <Global className="size-5" />}
                        value={selected ? selected.name : props.value ? props.value.toUpperCase() : undefined}
                        placeholder="Select nationality"
                        opened={opened}
                        onToggle={() => opened ? close() : setOpened(true)}
                    />
                </div>
            </Popover.Target>
            <Popover.Dropdown styles={{ dropdown: { padding: 0, maxWidth: "calc(100vw - 16px)", minWidth: "min(280px, calc(100vw - 16px))" } }}>
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    onKeyDown={nav.onKeyDown}
                    placeholder="Search country"
                    label="Search nationality"
                    listId="hotel-nationality-list"
                    activeId={nav.activeId}
                />
                <div id="hotel-nationality-list" role="listbox" aria-label="Nationalities" className="p-1 h-fit max-h-72 overflow-x-hidden overflow-y-auto scrolls">
                    {countries.length === 0 && (
                        <div className="p-4 text-center text-sm text-zinc-500">No country matches <span className="font-semibold text-zinc-700">"{search.trim()}"</span></div>
                    )}
                    {countries.map((country, index) => {
                        const isSelected = country.code.toLowerCase() === props.value
                        return (
                            <React.Fragment key={country.code}>
                                {index === 0 && suggestedCount > 0 && <GroupHeading>Suggested</GroupHeading>}
                                {index === suggestedCount && suggestedCount > 0 && <GroupHeading>All countries</GroupHeading>}
                                <div
                                    id={nav.optionId(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() => nav.setActive(index)}
                                    onClick={() => select(country)}
                                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer transition-colors ${nav.active === index ? 'bg-slate-100' : ''}`}>
                                    <CountryFlag code={country.code} />
                                    <span className={`min-w-0 flex-1 truncate ${isSelected ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                                        <Highlight text={country.name} term={search.trim()} />
                                    </span>
                                    {isSelected && <FiCheck className="shrink-0 text-primary" aria-hidden />}
                                </div>
                            </React.Fragment>
                        )
                    })}
                </div>
                <div className="border-t border-gray-200 px-3 py-2 text-xs text-zinc-500">
                    Hotels can price rooms by nationality. Choose the passport the lead guest will travel on.
                </div>
            </Popover.Dropdown>
        </Popover>
    )
}
