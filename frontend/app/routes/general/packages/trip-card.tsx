

import { humanDateFormat, TripTypeOptions } from '../../../components/utils'
import type { TripProps } from 'global'
import { FaMinus } from 'react-icons/fa6'
import { useRef } from 'react'
import Imaged from '../../../components/general/Imaged'
import { Carousel } from '@mantine/carousel'
import Autoplay from 'embla-carousel-autoplay'
import Linked from '../../../components/general/Linked'
import { Clock, Flag, People } from 'iconsax-reactjs'
import dayjs from 'dayjs'

type componentProps = {
    item: TripProps
    imageHeight: string
    home: boolean
}


export default function TripCard({ item, imageHeight, home }: componentProps) {
    const autoplay = useRef(Autoplay({ delay: 3000 }));

    return (
        <div className='relative text-sm bg-white p-1 rounded-xl'>
            <Carousel
                slideSize={{ base: '100%' }}
                slideGap={{ base: 0, sm: 'md' }}
                emblaOptions={{ loop: true, align: 'start' }}
                plugins={[autoplay.current]}
            >
                {item.images?.map((ele, index) => (
                    <Carousel.Slide key={index}>
                        <Imaged src={ele} height={imageHeight} />
                    </Carousel.Slide>
                ))}
            </Carousel>
            <div className="px-3 pt-1 pb-3 h-32 overflow-y-auto scrolls">
                <Linked to={`/packages/${item.slug}/${item.id}`} className="font-bold underline text-blue-600">{item.title}</Linked>

                <div className={`${home ? 'text-[0.75rem]' : 'text-[0.6rem]'} font-semibold`}>
                    <div className="flex flex-wrap items-center gap-1 my-2">{item.tripType === TripTypeOptions.group ? <>{humanDateFormat(item.startDate || '')} <FaMinus /> {humanDateFormat(item.endDate || '')}</> : <>{dayjs(item.startDate).format("MMMM YYYY")} <FaMinus /> {dayjs(item.endDate).format("MMMM YYYY")}</>} </div>
                    <div className="flex items-start gap-2 flex-wrap ">
                        <div className="uppercase bg-secondary py-1 px-2 rounded-sm text-white">{item.tripType} Trip</div>
                        <div className="border border-gray-300 p-1 rounded-md flex flex-wrap items-center gap-1 bg-zinc-100"> <Clock size="13" />{item.itineraries?.length} Day{item.itineraries?.length === 1 ? '' : 's'}</div>
                        {item.prices?.map(((ele, i) => (
                            <div className="border border-gray-300 p-1 rounded-md flex flex-wrap items-center gap-1 bg-zinc-100" key={i}> <People size="13" /> {ele.priceType}</div>
                        )))}
                        {item.destinations?.map(((ele, i) => (
                            <div className="border border-gray-300 p-1 rounded-md flex flex-wrap items-center gap-1 bg-zinc-100" key={i}> <Flag size="13" /> {ele.country}, {ele.city}</div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    )
}
