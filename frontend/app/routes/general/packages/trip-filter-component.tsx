import React from 'react'
import { RangeSlider } from '@mantine/core'
import { FiCheck } from 'react-icons/fi'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'

type responseProps = {
    countries: string[]
    cities: string[]
    startDates: string[]
    endDates: string[]
    tripTypes: string[]
    minPrice: number,
    maxPrice: number
}

/** URL keys understood by GET /trips */
export const PACKAGE_FILTER_KEYS = ['tripType', 'country', 'city', 'startMonth', 'endMonth', 'minPrice', 'maxPrice'] as const

const formatNaira = (value: number) => `₦${Math.round(value).toLocaleString()}`
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

export default function FilterComponent() {
    const [searchParams, setSearchParams] = useSearchParams()
    const { data, isLoading } = useFetchResponse<responseProps>({
        endpoint: NewApis.trips.destinations
    })

    /** Sets (or clears) filter keys and goes back to the first page */
    function setFilters(next: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams)
        Object.entries(next).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
        params.delete('p')
        params.delete('page')
        setSearchParams(params)
    }

    function clearAll() {
        setFilters(Object.fromEntries(PACKAGE_FILTER_KEYS.map((key) => [key, null])))
    }

    const activeCount = PACKAGE_FILTER_KEYS.filter((key) => searchParams.get(key)).length

    if (isLoading) return <div className="p-3"><Skeleton height={36} count={8} className="mb-2" /></div>

    return (
        <div className='bg-white rounded-md'>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold text-base">Filters{activeCount > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs">{activeCount}</span>}</div>
                {activeCount > 0 && <button type="button" onClick={clearAll} className="text-sm font-semibold text-primary hover:underline cursor-pointer">Clear all</button>}
            </div>

            <OptionGroup title="Trip type" param="tripType" options={data?.tripTypes ?? []} format={titleCase} value={searchParams.get('tripType')} onChange={setFilters} />
            <OptionGroup title="Country" param="country" options={data?.countries ?? []} value={searchParams.get('country')} onChange={setFilters} limit={6} />
            <OptionGroup title="City" param="city" options={data?.cities ?? []} value={searchParams.get('city')} onChange={setFilters} limit={6} />

            {data && data.maxPrice > data.minPrice && (
                <PriceRange
                    bounds={[data.minPrice, data.maxPrice]}
                    min={searchParams.get('minPrice')}
                    max={searchParams.get('maxPrice')}
                    onChange={(min, max) => setFilters({ minPrice: min, maxPrice: max })}
                />
            )}

            <OptionGroup title="Starting in" param="startMonth" options={data?.startDates ?? []} value={searchParams.get('startMonth')} onChange={setFilters} columns />
            <OptionGroup title="Ending in" param="endMonth" options={data?.endDates ?? []} value={searchParams.get('endMonth')} onChange={setFilters} columns />
        </div>
    )
}

type groupProps = {
    title: string
    param: string
    options: string[]
    value: string | null
    onChange: (next: Record<string, string | null>) => void
    format?: (value: string) => string
    limit?: number
    columns?: boolean
}

function OptionGroup(props: groupProps) {
    const [expanded, setExpanded] = React.useState(false)
    if (props.options.length === 0) return null
    const visible = expanded || !props.limit ? props.options : props.options.filter((option, index) => index < props.limit! || option === props.value)
    return (
        <div className="p-3 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{props.title}</div>
                {props.value && <button type="button" onClick={() => props.onChange({ [props.param]: null })} className="text-xs font-semibold text-primary hover:underline cursor-pointer">Reset</button>}
            </div>
            <div className={props.columns ? 'grid grid-cols-2 gap-1' : 'space-y-0.5'}>
                {visible.map((option) => {
                    const selected = props.value === option
                    return (
                        <button key={option} type="button" role="radio" aria-checked={selected}
                            onClick={() => props.onChange({ [props.param]: selected ? null : option })}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm cursor-pointer transition-colors ${selected ? 'bg-primary/10 font-semibold text-zinc-900' : 'text-zinc-700 hover:bg-slate-50'}`}>
                            <span className={`shrink-0 size-4 rounded-full border flex items-center justify-center ${selected ? 'border-primary bg-primary text-white' : 'border-gray-400'}`}>{selected && <FiCheck className="size-3" strokeWidth={3} />}</span>
                            <span className="truncate">{props.format ? props.format(option) : option}</span>
                        </button>
                    )
                })}
            </div>
            {props.limit && props.options.length > props.limit && (
                <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 text-sm font-semibold text-primary hover:underline cursor-pointer">
                    {expanded ? 'Show less' : `Show all ${props.options.length}`}
                </button>
            )}
        </div>
    )
}

type priceProps = {
    bounds: [number, number]
    min: string | null
    max: string | null
    onChange: (min: string | null, max: string | null) => void
}

/** Lowest per-person price of each package, in NGN */
function PriceRange({ bounds, min, max, onChange }: priceProps) {
    const [floor, ceil] = [Math.floor(bounds[0]), Math.ceil(bounds[1])]
    const low = Math.max(floor, Number(min ?? floor))
    const high = Math.min(ceil, Number(max ?? ceil))
    const [value, setValue] = React.useState<[number, number]>([low, high])
    React.useEffect(() => { setValue([low, high]) }, [low, high])
    const step = Math.max(1, Math.round((ceil - floor) / 100))

    return (
        <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
                <div className="font-semibold">Price per person</div>
                {(min || max) && <button type="button" onClick={() => onChange(null, null)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">Reset</button>}
            </div>
            <div className="flex justify-between text-sm font-semibold tabular-nums"><span>{formatNaira(value[0])}</span><span>{formatNaira(value[1])}</span></div>
            <div className="px-1 pb-1">
                <RangeSlider
                    min={floor}
                    max={ceil}
                    step={step}
                    minRange={step}
                    value={value}
                    onChange={setValue}
                    onChangeEnd={([nextMin, nextMax]) => onChange(nextMin > floor ? String(nextMin) : null, nextMax < ceil ? String(nextMax) : null)}
                    label={null}
                    color="var(--color-primary)"
                    size="sm"
                    thumbSize={18}
                />
            </div>
            <div className="text-xs text-zinc-500">Starting price of each package</div>
        </div>
    )
}
