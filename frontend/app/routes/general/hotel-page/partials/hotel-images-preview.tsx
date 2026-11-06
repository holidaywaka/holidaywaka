import { Carousel } from '@mantine/carousel';
import type { EmblaCarouselType } from 'embla-carousel';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-reactjs';
import React from 'react'
import { FiX } from 'react-icons/fi';
import Formbutton from '~/components/general/Formbutton';
import HotelImage from '~/components/hotels-components/hotel-image';
import type { hotelImageProps, hotelProps } from '~/routes/general/hotel-page/types';

type props = {
    images: hotelImageProps[];
    hotel?: hotelProps;
    close: () => void;
    onShowRooms?: () => void;
    preview: {
        status: boolean;
        index: number;
    };
}

export default function HotelImagesPreview(props: props) {
    const [activeIndex, setActiveIndex] = React.useState(props.preview.index);
    const [embla, setEmbla] = React.useState<EmblaCarouselType | null>(null);
    const thumbnailRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const handleThumbnailClick = (index: number) => {
        setActiveIndex(index);
        embla?.scrollTo(index);
    };

    React.useEffect(() => {
        if (!embla) return;
        setActiveIndex(props.preview.index);
        embla.scrollTo(props.preview.index, true);
    }, [embla, props.preview.index]);

    React.useEffect(() => {
        thumbnailRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [activeIndex]);

    return (
        <div className="fixed top-0 left-0 right-0 h-dvh w-full  bg-black/50 z-999">
            <div className="mx-auto w-[95%] h-[96dvh] mt-3 bg-white rounded-xl p-3 md:p-4">
                <div className="relative">
                    <div className="absolute top-0 right-0 cursor-pointer text-2xl active:scale-95 transition-all" onClick={props.close}>
                        <FiX />
                    </div>
                    <div className="font-bold">{props.hotel?.name}</div>
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-5">
                        <div className="lg:col-span-6">
                            <div className="text-center">{activeIndex + 1} of {props.images?.length}</div>
                            <div className="">
                                <Carousel
                                    withIndicators
                                    emblaOptions={{ dragFree: true, align: 'start', startIndex: props.preview.index }}
                                    slideGap="md"
                                    getEmblaApi={setEmbla}
                                    onSlideChange={setActiveIndex}
                                    nextControlIcon={<div className="bg-white p-2 rounded-full"> <ArrowRight2 size={16} /> </div>}
                                    previousControlIcon={<div className="bg-white p-2 rounded-full"> <ArrowLeft2 size={16} /> </div>}
                                    className="w-full rounded-lg overflow-hidden bg-gray-100"
                                >
                                    {props.images?.map((item, index) => (
                                        <Carousel.Slide key={index}>
                                            <HotelImage
                                                image={item?.url}
                                                size="1024x768"
                                                className="w-full h-91 md:h-[60dvh] object-contain rounded-lg"
                                            />
                                        </Carousel.Slide>
                                    ))}
                                </Carousel>

                                {/* Thumbnail preview section */}
                                <div className="overflow-x-auto no-scrolls mt-5">
                                    <div className="w-fit flex items-center gap-2">
                                        {props.images?.map((item, index) => (
                                            <div
                                                className="w-25 h-20 relative"
                                                key={index}
                                                ref={(el) => { thumbnailRefs.current[index] = el; }}
                                                onClick={() => handleThumbnailClick(index)}
                                            >
                                                {activeIndex !== index && <div className="absolute size-full bg-white/50 rounded-lg cursor-pointer"></div>}
                                                <HotelImage
                                                    image={item?.url}
                                                    size="240x240"
                                                    className="w-25 h-20 object-cover rounded-lg cursor-pointer active:scale-95 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 hidden lg:block">
                            <div className="bg-gray-100 rounded-t-xl">
                                <div className="font-bold text-lg px-3 pt-3">Services and amenities</div>
                                <div className="p-3 h-[65dvh] overflow-y-auto">
                                    {props.hotel?.amenity_groups?.map((group, index) => (
                                        <div key={index} className="mb-2">
                                            <div className="font-bold">{group.group_name}</div>
                                            <div className="text-sm space-y-2 ml-2">
                                                {group.amenities?.map((item, idx) => (
                                                    <div className="flex items-center gap-2" key={idx}>
                                                        <div className="size-1 bg-zinc-400 rounded-full"></div>
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-b-xl bg-gray-100 p-3">
                                <Formbutton title="Show rooms" type="button" onClick={props.onShowRooms} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
