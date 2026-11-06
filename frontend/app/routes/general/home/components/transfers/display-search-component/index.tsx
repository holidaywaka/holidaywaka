

import { useQuery } from '@tanstack/react-query'
import type { singlePlaceProps, transferOfferPriceprops } from 'global'
import { convert } from 'html-to-text'
import { ArrowRight, Profile2User } from 'iconsax-reactjs'
import React from 'react'
import { BiMap } from 'react-icons/bi'
import { RiLuggageCartFill } from 'react-icons/ri'
import Skeleton from 'react-loading-skeleton'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router'
import Currencies from '~/components/general/Currencies'
import Formbutton from '~/components/general/Formbutton'
import { BackToTop, TransferOptionType } from '~/components/utils'
import BookAirportTransfer from '~/routes/general/home/components/transfers/display-search-component/book-modal'
import { Apis, Post } from '~/services/apis'
import type { RootState } from '~/store/store'

type displaycomponentProps = {
    start_lat: string
    start_lon: string
    finish_lat?: string
    finish_lon?: string
    origin: singlePlaceProps | null
    destination?: singlePlaceProps | null
    isTransfer: boolean
    transferType: string
}


export default
    function DisplaySearchResultBody(props: displaycomponentProps) {
    const [searchParams,] = useSearchParams()
    const [screen, setScreen] = React.useState(1)
    const searchTransferType = searchParams.get("transferType")
    const { geoLocation } = useSelector((state: RootState) => state.data)
    const [single, setSingle] = React.useState({
        data: {} as transferOfferPriceprops,
        airportReturn: null as transferOfferPriceprops | null | undefined
    })
    const [durations, setDurations] = React.useState<string[]>([])
    const queryProps = props.isTransfer ? `fetch-transfer-pricing-${props.start_lat}-${props.start_lon}-${props.finish_lat}-${props.finish_lon}` : `fetch-chauffeur-pricing-${props.start_lat}-${props.start_lon}`
    const valuesProps = props.isTransfer ? { finish_lat: props.finish_lat, finish_lon: props.finish_lon } : {}
    const placeProps = props.isTransfer ? {} : { place_id: props.origin?.place_id }



    const { data, isLoading } = useQuery({
        queryKey: [`${queryProps}`, searchTransferType],
        queryFn: async () => {
            const values = {
                start_lat: props.start_lat,
                start_lon: props.start_lon,
                currency: geoLocation.abbreviation,
                ...placeProps,
                ...valuesProps
            }
            let response2 = [];
            if (props.isTransfer) {
                if (props.transferType === TransferOptionType.return.title) {
                    const values2 = {
                        finish_lat: props.start_lat,
                        finish_lon: props.start_lon,
                        currency: geoLocation.abbreviation,
                        ...placeProps,
                        start_lat: props.finish_lat,
                        start_lon: props.finish_lon,
                    }

                    response2 = await Post(Apis.iway.transfer_offer_pricing, values2)
                }
            }
            const response = props.isTransfer ? await Post(Apis.iway.transfer_offer_pricing, values) : await Post(Apis.iway.chauffeur_offer_pricing, values)
            const result: transferOfferPriceprops[] = response
            const result2: transferOfferPriceprops[] = response2
            return {
                result,
                result2
            }
        }
    })


    function HandleView(values: transferOfferPriceprops, airportReturn: transferOfferPriceprops | null | undefined) {
        setSingle({
            data: values,
            airportReturn
        });
        let durationValues: string[] = []
        new Array(20).fill(0).map((_, index) => {
            if (index + 1 >= Number(values?.minimum_duration_count)) return durationValues.push(`${index + 1}`)
        })
        setDurations(durationValues)
        setScreen(2)
        BackToTop()
    }

    if (isLoading) return (
        <div>
            <div className="mx-auto my-7 w-11/12 max-w-4xl">
                <div className="">
                    {new Array(5).fill(0).map((_, index) => (
                        <Skeleton key={index} height="10rem" className="mb-2 rounded-lg!" />
                    ))}
                </div>
            </div>
        </div>
    )

    if (!isLoading && (data && data?.result?.length < 1)) return (
        <div className="bg-white py-10">
            <div className="mx-auto my-7 w-11/12 max-w-4xl">
                <div className="">
                    <div className="">
                        <div className="">
                            <div className="w-11/12 mx-auto flex flex-col items-center gap-3">
                                <img src="/images/not-found.svg" alt="" className="" />
                                <div className="text-zinc-600">No results found, try adjusting your request</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    if (screen === 2) return (
        <>
            <BookAirportTransfer
                data={single.data}
                airportReturn={single.airportReturn ?? {}}
                durations={durations}
                onClose={() => setScreen(1)}
                origin={props.origin}
                transferType={props.transferType}
                isTransfer={props.isTransfer?.toString()}
                destination={props?.destination ?? null}
            />
        </>
    )

    if (screen === 1) return (
        <>
            <div className="mx-auto my-7 w-11/12 max-w-4xl">
                <div className="">
                    <div className="flex items-center gap-2 font-bold mb-3">
                        <BiMap />
                        {props.origin?.address}
                        {props.isTransfer && <>
                            <ArrowRight />
                            {props.destination?.address}
                        </>}
                    </div>
                    {(data?.result && data?.result?.length > 0) && data?.result?.map((item, index) => {
                        const airportReturn = props.transferType === TransferOptionType.return.title ? data?.result2.find(ele =>
                            ele.start_place?.title === item.finish_place?.title &&
                            ele.finish_place?.title === item.start_place?.title
                        ) : null
                        const getCurrency = Currencies.find(ele => ele.abbreviation === item?.charge?.currency)?.symbol
                        const currency = convert(getCurrency || '')

                        return (
                            <div className="bg-white mb-3 rounded-lg" key={index}>
                                <div className="grid grid-cols-1 md:grid-cols-7">
                                    <div className="md:col-span-5 md:border-r-2 border-gray-300 border-dashed p-2 lg:p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2">
                                            <div className="">
                                                <img src={`${item?.car_photo ? item.car_photo : "/images/van.jpg"}`} className="h-20 w-auto" loading="lazy" />
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="font-extrabold text-lg">{item?.car_title}</div>
                                                <div className="text-sm">{item?.car_model}</div>
                                                <div className="flex items-center justify-start md:justify-end flex-wrap gap-2">
                                                    <div className="flex items-center gap-1 font-bold text-xs text-zinc-600"> <Profile2User size="13" /> {item?.car_capacity} Passengers </div>
                                                    <div className="size-1 rounded-full bg-zinc-500"></div>
                                                    <div className="flex items-center gap-1 font-bold text-xs text-zinc-600"><RiLuggageCartFill /> {item?.car_luggage_capacity} </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
                                            <div className="text-sm font-bold">Services</div>
                                            <div className="">
                                                {item?.class_services?.map((ele, i) => (
                                                    <div className="flex items-center gap-2 text-xs font-medium pb-1" key={i}>
                                                        <div className="size-1.5 rounded-full bg-zinc-600"></div>
                                                        <div className="">{ele.title}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 p-2 md:p-4">
                                        <div className="w-11/12 items-center grid grid-cols-2 md:grid-cols-1">
                                            <div className="font-bold text-lg mt-4 lg:text-right">{currency}{(Number(item?.charge?.amount) + (props.transferType === TransferOptionType.return.title ? Number(airportReturn?.charge?.amount) : 0))?.toLocaleString()}</div>
                                            {!props.isTransfer && <>
                                                <div className="mt-2 text-xs text-zinc-500 lg:text-right">Min. {item.minimum_duration_text} x {currency}{Number(item?.charge?.price_per_hour)?.toLocaleString()}/hr</div>
                                                <div className="mt-2 text-xs text-zinc-500 lg:text-right">Delivery cost: {currency}{Number(item?.charge?.delivery_costs)?.toLocaleString()}</div>
                                            </>}
                                            <div className="mt-3 lg:mt-8">
                                                <Formbutton onClick={() => HandleView(item, airportReturn)} title="Order Now" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
