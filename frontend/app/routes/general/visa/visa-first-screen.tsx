
import type { visaCountryDestinationProps, visacountryProps } from 'global'
import React from 'react'
import { FiChevronDown, FiFileText, FiFlag } from 'react-icons/fi'
import Skeleton from 'react-loading-skeleton'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router'
import SearchInput from '~/components/general/search-input'
import { IsaNumber } from '~/components/utils'
import type { visaCountryPropsRes } from '~/routes/admin/visa/types'
import type { fieldProps, paramsProps } from '~/routes/general/visa/types'
import VisaFlagView from '~/routes/general/visa/visa-flag-view'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { RootState } from '~/store/store'


type props = {
    sendData: (values: fieldProps) => void;
}
export default function ScreenOneComponent(props: props) {
    const [searchParams] = useSearchParams();

    const { data, isLoading } = useFetchResponse<visaCountryPropsRes>({
        endpoint: NewApis.visa.all_countries,
        isSearch: true,
        searchParams: searchParams,
    })

    const header = (
        <div className="mb-6">
            <h2 className="font-extrabold text-2xl md:text-3xl text-primary">Where are you travelling?</h2>
            <p className="text-zinc-500 text-sm mt-1 mb-5">Choose a country to see visa types, requirements and fees.</p>
            <div className="max-w-md">
                <SearchInput />
            </div>
        </div>
    )

    if (isLoading) return (
        <div>
            {header}
            <div className="space-y-3">
                {new Array(8).fill(0).map((_, index) => (
                    <Skeleton className='h-16! rounded-2xl!' key={index} />
                ))}
            </div>
        </div>
    )
    const countries = data?.data?.filter(ele => Number(ele.destinations?.length) > 0) ?? []
    return (
        <div>
            {header}
            {countries.length < 1 ? <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 bg-white">
                <FiFlag className="mx-auto text-3xl text-zinc-300" />
                <div className="font-semibold text-primary mt-3">No countries found</div>
                <div className="text-sm text-zinc-500">Try a different search.</div>
            </div> :
                <div className="space-y-3">
                    {countries.map((country, index) => (
                        <SingleVisa
                            key={index}
                            country={country}
                            id={index}
                            sendData={props.sendData}
                        />
                    ))}
                </div>}
        </div>
    )
}


export type selectedVisa = { tag: paramsProps, destination: visaCountryDestinationProps, visa: visacountryProps }
type singlevisaProps = {
    country: visacountryProps;
    sendData: (value: fieldProps) => void;
    id: number;
}
function SingleVisa(props: singlevisaProps) {
    const [open, setOpen] = React.useState('');
    function handleAction(val: string) {
        if (val !== open) return setOpen(val);
        setOpen('')
    }

    function handleSelection(values: selectedVisa) {
        const content = {
            country: values.visa.country,
            fee: values.visa.fee,
            price: values.destination.price,
            old_price: values.destination.old_price ?? 0,
            visaType: values.destination.visaType,
            requirement: values.destination.requirement,
            paymentType: values.tag
        }
        props.sendData(content);
    }
    const isOpen = open === props.country.country
    const count = Number(props.country?.destinations?.length)
    return (
        <div className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
            <button type="button" aria-expanded={isOpen} className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer text-left" onClick={() => handleAction(String(props.country.country))}>
                <VisaFlagView
                    country={String(props.country?.country)}
                />
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-500 hidden sm:inline">{count} visa type{count === 1 ? '' : 's'}</span>
                    <span className={`size-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-zinc-500'}`}> <FiChevronDown /> </span>
                </div>
            </button>
            {isOpen && <div className="px-4 pb-4 space-y-4">
                {props.country?.destinations?.map((item, index) => {
                    const hasDiscount = Number(item.old_price) > Number(item.price)
                    return (
                        <div className="rounded-xl border border-slate-200 bg-background/60" key={index}>
                            <div className="p-4">
                                <div className="inline-flex items-center gap-2 font-bold text-primary"> <FiFileText className="text-secondary" /> {item.visaType}</div>
                            </div>
                            {item?.requirement?.length > 0 && <details className="mx-4 mb-4 rounded-lg bg-white border border-slate-200 text-sm group">
                                <summary className="cursor-pointer select-none p-3 font-semibold text-primary flex items-center justify-between">
                                    Requirements <FiChevronDown className="group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="whitespace-pre-wrap px-3 pb-3 text-zinc-600 text-xs leading-relaxed">{item.requirement}</div>
                            </details>}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pb-4">
                                <OptionTile
                                    label="Talk to an agent"
                                    price="Free"
                                    note="Ask questions on WhatsApp first"
                                    onClick={() => handleSelection({ tag: "enquiry", destination: item, visa: props.country })}
                                    tone="ghost"
                                />
                                <OptionTile
                                    label="Book appointment"
                                    price={IsaNumber(String(props.country.fee))}
                                    note="Deducted from your visa fee"
                                    onClick={() => handleSelection({ tag: "appointment", destination: item, visa: props.country })}
                                    tone="secondary"
                                />
                                <OptionTile
                                    label="Start application"
                                    price={IsaNumber(item.price)}
                                    oldPrice={hasDiscount ? IsaNumber(item.old_price) : undefined}
                                    note="Full payment, we begin immediately"
                                    onClick={() => handleSelection({ tag: "fullPayment", destination: item, visa: props.country })}
                                    tone="primary"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>}
        </div>
    )
}

type optionTileProps = {
    label: string
    price: string
    oldPrice?: string
    note: string
    onClick: () => void
    tone: "ghost" | "secondary" | "primary"
}
function OptionTile(props: optionTileProps) {
    const button = {
        ghost: "bg-slate-100 text-primary hover:bg-slate-200",
        secondary: "bg-secondary text-primary hover:brightness-95",
        primary: "bg-primary text-white hover:bg-primary/90",
    }[props.tone]
    return (
        <div className={`rounded-xl bg-white border p-4 flex flex-col ${props.tone === "primary" ? 'border-primary/40' : 'border-slate-200'}`}>
            <div className="text-xs text-zinc-500">{props.label}</div>
            <div className="font-extrabold text-xl text-primary mt-1">
                {props.price} {props.oldPrice && <del className="text-zinc-400 text-sm font-medium ml-1">{props.oldPrice}</del>}
            </div>
            <div className="text-xs text-zinc-500 mt-1 mb-4 flex-1">{props.note}</div>
            <button type="button" onClick={props.onClick} className={`w-full rounded-lg py-2.5 text-sm font-semibold cursor-pointer active:scale-95 transition-all ${button}`}>{props.label}</button>
        </div>
    )
}
