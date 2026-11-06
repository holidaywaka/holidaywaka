import { BsFlagFill } from "react-icons/bs";
import { SlCalender } from "react-icons/sl"
import { humanDateFormat, LocalStorageName, normalizeSpaces, TripTypeOptions } from "~/components/utils"
import { useNavigate, useParams } from "react-router"
import Skeleton from "react-loading-skeleton"
import PackageReservationForm from "~/routes/general/packages/package-trip-reservation-form"
import { useRef } from "react"
import type { geoLocationProps, TripProps } from "global"
import { Carousel } from "@mantine/carousel"
import Autoplay from "embla-carousel-autoplay"
import Imaged from "~/components/general/Imaged"
import { useSelector } from "react-redux";
import type { RootState } from "~/store/store";
import useFetchResponse from "~/services/fetchResponse";
import { NewApis } from "~/services/new-apis";
import dayjs from "dayjs";
import { BiBoltCircle, BiCircle } from "react-icons/bi";
import Seo from "~/components/general/Seo";
import { absoluteUrl, breadcrumbJsonLd, summarize } from "~/services/seo";

// Tags depend on the fetched package, so <Seo /> renders them instead of React Router's <Meta />
export function meta() {
    return []
}

function PackageSeo({ data, fallbackPath }: { data?: TripProps, fallbackPath: string }) {
    if (!data?.title) return <Seo title="Holiday Package" path={fallbackPath} />

    const path = `/packages/${data.slug}/${data.id}`
    const description = summarize(data.summary || data.description)
    const images = (data.images ?? []).map((image) => absoluteUrl(image))
    const currency = /^[A-Z]{3}$/.test(data.currency ?? '') ? data.currency : undefined

    return (
        <Seo
            title={data.title}
            description={description}
            path={path}
            image={data.images?.[0]}
            imageAlt={data.title}
            type="product"
            jsonLd={[
                {
                    "@context": "https://schema.org",
                    "@type": "TouristTrip",
                    name: data.title,
                    description,
                    url: absoluteUrl(path),
                    ...(images.length ? { image: images } : {}),
                    ...(data.destinations?.length ? {
                        itinerary: {
                            "@type": "ItemList",
                            itemListElement: data.destinations.map((item, index) => ({
                                "@type": "ListItem",
                                position: index + 1,
                                item: { "@type": "Place", name: [item.city, item.country].filter(Boolean).join(", ") },
                            })),
                        },
                    } : {}),
                    ...(currency && data.prices?.length ? {
                        offers: data.prices.map((item) => ({
                            "@type": "Offer",
                            name: item.priceType,
                            price: Number(item.price),
                            priceCurrency: currency,
                            url: absoluteUrl(path),
                            availability: "https://schema.org/InStock",
                        })),
                    } : {}),
                },
                breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Holiday Packages", path: "/packages" },
                    { name: data.title, path },
                ]),
            ]}
        />
    )
}

export default function SinglePackage() {
    const { id, slug } = useParams()
    const locals: geoLocationProps = JSON.parse(localStorage.getItem(LocalStorageName) ?? 'null')
    const autoplay = useRef(Autoplay({ delay: 2000 }));
    const navigate = useNavigate()
    const {geoLocation} = useSelector((state: RootState) => state.data)

    const {data, isLoading} = useFetchResponse<TripProps>({
        endpoint: `${NewApis.trips.single}/${id}/${geoLocation?.country_code ?? locals?.country_code ?? 'NGN'}`
    })


    const seo = <PackageSeo data={data} fallbackPath={`/packages/${slug}/${id}`} />

    if (isLoading) return (
        <div className="w-11/12 mx-auto mb-20">
            {seo}
            <Skeleton style={{ height: '30rem' }} />
            <div className="grid grid-cols-2 gap-3">
                <Skeleton count={.5} style={{ height: '3rem' }} />
                <Skeleton count={1} style={{ height: '3rem', }} />
            </div>
            <Skeleton count={5} style={{ height: '3rem', }} />
        </div>
    )

    return (
        <div className="relative">
            {seo}
            <div className="mb-20">
                <div className="font-bold text-xl lg:text-4xl w-11/12 mx-auto mt-10 mb-5">{data?.title}</div>
                {data?.images?.length === 1 && <Imaged src={data?.images?.[0]} height={"25rem"} rounded={false} />}
                {Number(data?.images?.length) > 1 && <Carousel
                    slideSize={{ base: '100%', sm: '50%', md: '50%' }}
                    slideGap={{ base: 0, sm: "md" }}
                    emblaOptions={{ loop: true, align: 'start' }}
                    plugins={[autoplay.current]}
                >
                    {data?.images?.map((ele, index) => (
                        <Carousel.Slide key={index}>
                            <Imaged src={ele} height={"25rem"} rounded={false} />
                        </Carousel.Slide>
                    ))}
                </Carousel>}
                <div className="w-full md:w-11/12 mx-auto mt-5">
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                        <div className="lg:col-span-4 bg-white p-3 h-fit text-sm!">
                            <div className="my-6 space-y-2 border-b border-slate-300 pb-3">
                                <div className="flex justify-between gap-3 flex-wrap border-b border-slate-300 pb-3 mb-2">
                                    <div className="font-bold text-lg"><span className="uppercase text-xs font-bold bg-secondary py-1 px-2 rounded-sm text-white">{data?.tripType} Trip</span> {data?.summary}</div>
                                </div>
                                <div className="">
                                    <div className="mt-5 text-sm">
                                        {data?.prices?.map((item, index) => (
                                            <div className="bg-slate-100 p-3 mb-2 rounded-md border border-slate-200" key={index}>
                                                <div className="flex flex-wrap md:justify-between gap-3">
                                                    <div className="font-bold text-lg lg:text-xl">{data?.currency}{Number(item.price)?.toLocaleString()}</div>
                                                    <div className="md:text-right">
                                                        <div className='text-slate-700 font-medium'>{item.priceType}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 py-2">
                                    <div className="text-sm">
                                        {data?.destinations?.map((item, index) => (
                                            <div className="flex items-center gap-2 capitalize" key={index}> <div className="bg-green-100/50 border border-green-300! p-1 text-green-600 rounded-md"><BsFlagFill /></div> {item.country}, {item.city}</div>
                                        ))}
                                    </div>
                                    <div className="text-sm flex items-center md:justify-end gap-2"> <div className="bg-orange-100/50 border border-orange-300! p-1 text-orange-600 rounded-md"><SlCalender /></div> {data?.tripType === TripTypeOptions.group ? <>{humanDateFormat(data?.startDate || '')} - {humanDateFormat(data?.endDate || '')}</> : <>{dayjs(data?.startDate).format("MMMM YYYY")} - {dayjs(data?.endDate).format("MMMM YYYY")}</>}</div>
                                </div>
                            </div>
                            <div className="mb-4 whitespace-pre-wrap wrap-break-word">{normalizeSpaces(data?.description || '')}</div>

                            <div className="font-bold text-2xl mt-5">Package Inclusion</div>
                            {data?.inclusions?.map((item, index) => (
                                <div key={index} className="mb-3 ml-4"> <BiBoltCircle className="inline" /> {item}</div>
                            ))}

                            <div className="font-bold text-2xl mt-5">Tours:</div>
                            {data?.itineraries?.map((item, index) => (
                                <div key={index} className="mb-3 ml-4"> <span className="font-bold bg-zinc-100 py-1 px-2 rounded-sm border border-gray-300 text-xs uppercase leading-10">Day {index + 1}.</span> <span className="ml-2">{item}</span> </div>
                            ))}
                        </div>
                        <div className="lg:col-span-3">
                            <div className="sticky top-20 right-0">
                                <PackageReservationForm singleData={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
