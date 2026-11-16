import React from 'react'
import { Popover } from '@mantine/core'
import { useNavigate } from 'react-router'
import { FiCalendar, FiCheck, FiCompass, FiSearch, FiUser, FiUsers } from 'react-icons/fi'
import Formbutton from '~/components/general/Formbutton'
import { ApiCountries } from '~/components/general/ApiCountries'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import { CountryFlag, DROPDOWN_POPOVER, FieldTrigger, GroupHeading, useDropdownField, useListNavigation } from '~/routes/general/home/components/hotels/partials/search-field'

type PackageFilters = {
    countries: string[]
    startDates: string[]
    tripTypes: string[]
}

type Option = {
    /** Sent to /packages exactly as stored ("" = any) */
    value: string
    label: string
    detail?: string
    icon?: React.ReactNode
}

/** "MAURITIUS" / "south africa" -> "Mauritius" / "South Africa" (display only) */
const titleCase = (value: string) => value.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (match) => match.toUpperCase())

const countryCode = (name: string) => ApiCountries.find((country) => country.name.toLowerCase() === name.trim().toLowerCase())?.code

const TRIP_STYLES: Record<string, { label: string; detail: string; icon: React.ReactNode }> = {
    PRIVATE: { label: 'Private trip', detail: 'Just you and your companions, on your dates', icon: <FiUser className="size-4" /> },
    GROUP: { label: 'Group trip', detail: 'Join a scheduled departure with other travellers', icon: <FiUsers className="size-4" /> },
}

type OptionPickerProps = {
    id: string
    label: string
    icon: React.ReactNode
    heading: string
    anyOption: Option
    options: Option[]
    value: string
    onChange: (value: string) => void
    loading?: boolean
}

/** Field + dropdown list in the same style as the hotel and transfer pickers */
function OptionPicker({ id, label, icon, heading, anyOption, options, value, onChange, loading }: OptionPickerProps) {
    const { ref: fieldRef, opened, setOpened, open } = useDropdownField()
    const listRef = React.useRef<HTMLDivElement>(null)
    const items = React.useMemo(() => [anyOption, ...options], [anyOption, options])
    const selected = items.find((item) => item.value === value && item.value !== '')

    const close = () => setOpened(false)
    const select = (item: Option) => { onChange(item.value); close() }
    const nav = useListNavigation(items, select, close, id)

    // Start on the current choice and take keyboard focus without scrolling the page
    React.useEffect(() => {
        if (!opened) return
        nav.setActive(Math.max(0, items.findIndex((item) => item.value === value)))
        const frame = requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }))
        return () => cancelAnimationFrame(frame)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened])

    return (
        <Popover opened={opened} onChange={(next) => next ? open() : close()} width="target" {...DROPDOWN_POPOVER}>
            <Popover.Target>
                <div ref={fieldRef}>
                    <FieldTrigger
                        label={label}
                        icon={selected?.icon ?? icon}
                        value={selected?.label}
                        placeholder={loading ? 'Loading…' : anyOption.label}
                        opened={opened}
                        onToggle={() => opened ? close() : open()}
                        onClear={selected ? () => onChange('') : undefined}
                    />
                </div>
            </Popover.Target>
            <Popover.Dropdown styles={{ dropdown: { padding: 0, minWidth: 'min(300px, calc(100vw - 16px))', maxWidth: 'calc(100vw - 16px)', overflow: 'hidden' } }}>
                <div
                    ref={listRef}
                    id={`${id}-list`}
                    role="listbox"
                    tabIndex={-1}
                    aria-label={label}
                    aria-activedescendant={nav.activeId}
                    onKeyDown={nav.onKeyDown}
                    className="p-1.5 max-h-80 overflow-y-auto scrolls outline-none"
                >
                    {items.map((item, index) => {
                        const isSelected = item.value === value
                        const isActive = nav.active === index
                        return (
                            <React.Fragment key={item.value || 'any'}>
                                {index === 1 && <GroupHeading>{heading}</GroupHeading>}
                                <div
                                    id={nav.optionId(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() => nav.setActive(index)}
                                    onClick={() => select(item)}
                                    className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary/[0.06]' : ''}`}
                                >
                                    <span className={`shrink-0 size-9 rounded-md flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                        {item.icon ?? icon}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-sm truncate ${isSelected ? 'font-bold text-primary' : 'font-semibold text-zinc-900'}`}>{item.label}</span>
                                        {item.detail && <span className="block text-xs text-zinc-500 truncate">{item.detail}</span>}
                                    </span>
                                    {isSelected && <FiCheck className="shrink-0 size-4 text-primary" aria-hidden />}
                                </div>
                            </React.Fragment>
                        )
                    })}
                    {!loading && options.length === 0 && <div className="px-3 py-4 text-center text-sm text-zinc-500">No other options yet.</div>}
                </div>
            </Popover.Dropdown>
        </Popover>
    )
}

/** Home widget tab: pick where / what kind / when, then browse matching holiday packages */
export default function PackagesSearch() {
    const navigate = useNavigate()
    const [country, setCountry] = React.useState('')
    const [tripType, setTripType] = React.useState('')
    const [startMonth, setStartMonth] = React.useState('')

    const { data, isLoading } = useFetchResponse<PackageFilters>({ endpoint: NewApis.trips.destinations })

    const countryOptions = React.useMemo<Option[]>(() => {
        const seen = new Set<string>()
        return (data?.countries ?? [])
            // The same country can be stored in different casings ("MAURITIUS", "Mauritius")
            .filter((name) => !seen.has(name.trim().toLowerCase()) && Boolean(seen.add(name.trim().toLowerCase())))
            .map((name) => {
                const code = countryCode(name)
                return { value: name, label: titleCase(name), icon: code ? <CountryFlag code={code} /> : <FiCompass className="size-4" /> }
            })
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [data?.countries])

    const styleOptions = React.useMemo<Option[]>(() => (data?.tripTypes ?? []).map((type) => {
        const known = TRIP_STYLES[type.toUpperCase()]
        return { value: type, label: known?.label ?? `${titleCase(type)} trip`, detail: known?.detail, icon: known?.icon }
    }), [data?.tripTypes])

    const monthOptions = React.useMemo<Option[]>(() => (data?.startDates ?? []).map((month) => ({
        value: month, label: titleCase(month), detail: 'Departures this month', icon: <FiCalendar className="size-4" />,
    })), [data?.startDates])

    function submit(event: React.FormEvent) {
        event.preventDefault()
        const params = new URLSearchParams()
        if (country) params.set('country', country)
        if (tripType) params.set('tripType', tripType)
        if (startMonth) params.set('startMonth', startMonth)
        const query = params.toString()
        navigate(`/packages${query ? `?${query}` : ''}`)
    }

    return (
        <form onSubmit={submit} className="pb-10">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-2 md:gap-1.5">
                <OptionPicker id="package-country" label="Where to" icon={<FiCompass className="size-5" />} heading="Destinations"
                    anyOption={{ value: '', label: 'Any destination', detail: 'Browse every package', icon: <FiCompass className="size-4" /> }}
                    options={countryOptions} value={country} onChange={setCountry} loading={isLoading} />
                <OptionPicker id="package-type" label="Trip style" icon={<FiUsers className="size-5" />} heading="Trip styles"
                    anyOption={{ value: '', label: 'Private or group', detail: 'Show both kinds of trip', icon: <FiUsers className="size-4" /> }}
                    options={styleOptions} value={tripType} onChange={setTripType} loading={isLoading} />
                <OptionPicker id="package-month" label="Travel month" icon={<FiCalendar className="size-5" />} heading="Departure months"
                    anyOption={{ value: '', label: 'Any month', detail: 'Whenever suits you', icon: <FiCalendar className="size-4" /> }}
                    options={monthOptions} value={startMonth} onChange={setStartMonth} loading={isLoading} />
            </div>
            <div className="w-full max-w-60 mx-auto absolute -bottom-5 left-0 right-0">
                <Formbutton title="SEARCH" Icon={FiSearch} bg="!py-4 bg-primary text-white" />
            </div>
        </form>
    )
}
