import { useState } from 'react';
import { MdPhotoLibrary } from 'react-icons/md';
import HotelImage from '~/components/hotels-components/hotel-image'
import HotelImagesPreview from '~/routes/general/hotel-page/partials/hotel-images-preview';
import type { hotelImageProps, hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    images: hotelImageProps[];
    hotel?: hotelProps;
    onShowRooms?: () => void;
}

const GRID_THUMBNAILS = 6;

/** One large photo and a 3 x 2 grid; the last tile opens the gallery with the remaining count */
export default function HotelImagesViews(props: props) {
    const [preview, setPreview] = useState({ status: false, index: 0 });
    const images = props.images ?? [];
    const thumbnails = images.slice(1, 1 + GRID_THUMBNAILS);
    const remaining = images.length - 1 - thumbnails.length;
    const openAt = (index: number) => setPreview({ status: true, index });

    function close() {
        setPreview({ ...preview, status: false });
    }

    if (images.length === 0) return (
        <HotelImage className="w-full h-56 md:h-72 rounded-xl" placeholderText="The property has not shared photos yet" />
    )

    return (
        <>
            {preview.status && <HotelImagesPreview
                images={images}
                hotel={props.hotel}
                preview={preview}
                close={close}
                onShowRooms={() => { close(); props.onShowRooms?.(); }}
            />}
            <div className={`relative grid gap-2 h-64 sm:h-80 md:h-110 ${thumbnails.length ? 'grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] md:grid-rows-2' : 'grid-cols-1'}`}>
                <button type="button" onClick={() => openAt(0)} className="md:row-span-2 overflow-hidden rounded-xl cursor-pointer group">
                    <HotelImage image={images[0].url} size="1024x768" alt={props.hotel?.name} className="size-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                </button>
                {thumbnails.map((item, index) => {
                    const isLast = index === thumbnails.length - 1 && remaining > 0;
                    return (
                        <button type="button" key={item.url} onClick={() => openAt(index + 1)} className="hidden md:block relative overflow-hidden rounded-xl cursor-pointer group">
                            <HotelImage image={item.url} alt="" className="size-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
                            {isLast && <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xl font-semibold">+{remaining} photos</span>}
                        </button>
                    )
                })}
                <button type="button" onClick={() => openAt(0)} className="md:hidden absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow cursor-pointer">
                    <MdPhotoLibrary /> {images.length} photos
                </button>
            </div>
        </>
    )
}
