
import { FaMinus } from 'react-icons/fa6'
import { SlClock} from 'react-icons/sl'
import { ClientNaira, humanDateFormat, normalizeSpaces, TripTypeOptions } from '../../../components/utils'
import Imaged from '../../../components/general/Imaged'
import { Carousel } from '@mantine/carousel'
import type { deleteLayoutProps, TripProps } from "global"
import ModalHeader from '~/components/general/ModalHeader'
import dayjs from 'dayjs'

type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: TripProps | undefined | null
    refetch: () => void
    readOnly: boolean
}

export default function TripModal(props: componentProps) {

    return (
        <>
            <div className='text-sm pb-10 h-[95dvh] overflow-y-auto overflow-x-hidden scrolls px-4 pt-4'>
                <ModalHeader title={String(props.data?.title)} close={props.close} />
                <div className="">
                    <Carousel
                        slideSize={{ base: '100%' }}
                        slideGap={{ base: 0, sm: 'md' }}
                        emblaOptions={{ loop: true, align: 'start' }}
                    >
                        {props.data?.images?.map((item, index) => (
                            <Carousel.Slide key={index}>
                                <Imaged src={item} height="16rem" />
                            </Carousel.Slide>
                        ))}
                    </Carousel>
                </div>
                <div className="my-3">{props.data?.summary}</div>
                {props.data?.tripType === TripTypeOptions.group ? <div className="flex items-center flex-wrap gap-2 text-sm"> <SlClock /> {humanDateFormat(props.data?.startDate || '')} <FaMinus /> {humanDateFormat(props.data?.endDate || '')} </div> : <div className="flex items-center flex-wrap gap-2 text-sm"> <SlClock /> {dayjs(props.data?.startDate).format("MMMM YYYY")} <FaMinus /> {dayjs(props.data?.endDate).format("MMMM YYYY")} </div>}

                <div className="relative border-t-2 border-slate-300 mt-8">
                    <div className="absolute -top-5 ml-3 bg-white py-1 px-3">Pricing</div>
                    <div className="mt-5">
                        {props.data?.prices?.map((item, index) => (
                            <div className="p-1 mb-2" key={index}>
                                <div className="flex flex-wrap justify-between gap-3">
                                    <div className="font-bold text-xl">{ClientNaira}{Number(item.price)?.toLocaleString()}</div>
                                    <div className="text-left md:text-right">
                                        <div className='text-slate-500'>{item.priceType}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative border-t-2 border-slate-300 mt-8">
                    <div className="absolute -top-5 ml-3 bg-white py-1 px-3">Inclusions</div>
                    <div className="mt-5">
                        {props.data?.inclusions?.map((item, index) => (
                            <div className="p-1 mb-2" key={index}>{item}</div>
                        ))}
                    </div>
                </div>

                <div className="relative border-t-2 border-slate-300 mt-8">
                    <div className="absolute -top-5 ml-3 bg-white py-1 px-3">Itineraries</div>
                    <div className="mt-5">
                        {props.data?.itineraries?.map((item, index) => (
                            <div className="p-1 mb-2" key={index}>{item}</div>
                        ))}
                    </div>
                </div>

                <div className="relative border-t-2 border-slate-300 mt-8">
                    <div className="absolute -top-5 ml-3 bg-white py-1 px-3">Destinations</div>
                    <div className="mt-5">
                        {props.data?.destinations?.map((item, index) => (
                            <div className="p-1" key={index}>{item.country}, {item.city}</div>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-300 pt-3 mt-2 whitespace-pre-wrap">{normalizeSpaces(props.data?.description || '')}</div>
            </div>
        </>
    )
}
