import dayjs from 'dayjs'
import { ArrowRight2, Global, Home2, Minus, SearchNormal1 } from 'iconsax-reactjs'
import Linked from '~/components/general/Linked'
import { hotelSearchLink } from '~/routes/general/hotel-search/hotel-utils'
import type { HotelStay } from '~/routes/general/hotel-search/types'
import type { hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    open: () => void;
    hotel: hotelProps;
    stay: HotelStay | null;
}
export default function HotelSearchHeader(props: props) {
    const region = props.hotel.region;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div
            onClick={props.open}
            className="bg-white border border-slate-200/70 py-2 px-3 rounded-lg flex items-center gap-2 size-fit text-sm text-blue-700 cursor-pointer hover:border-zinc-400 active:scale-95 transition-all">
                <SearchNormal1 className="size-4" />
                <div className="font-semibold">New Search</div>
            </div>
            <div className="bg-white border border-slate-200/70 flex items-center flex-wrap gap-2 text-sm size-fit py-2 px-3 rounded-lg text-zinc-600">
                <div className="flex items-center gap-1">
                    <Linked to="/?service=hotels" className="text-blue-600 flex items-center gap-1"> <Home2 className="size-4 inline -mt-1" /> Main page</Linked>
                </div>
                {region && <>
                    <ArrowRight2 className="size-4" />
                    <div className="flex items-center gap-1">
                        {props.stay
                            ? <Linked to={hotelSearchLink(region.id, props.stay)} className="text-blue-600 flex items-center gap-1"> <Global className="size-4 inline -mt-1" /> {region.name}</Linked>
                            : <span className="flex items-center gap-1"> <Global className="size-4 inline -mt-1" /> {region.name}</span>}
                    </div>
                </>}
                {props.stay && <>
                    <div className="size-1 bg-zinc-500 rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <span>{dayjs(props.stay.checkin).format('D MMM, ddd')}</span>
                        <Minus className="size-4" />
                        <span>{dayjs(props.stay.checkout).format('D MMM, ddd')}</span>
                    </div>
                </>}
                <ArrowRight2 className="size-4" />
                <div className="font-medium text-zinc-900">{props.hotel.name}</div>
            </div>
        </div>
    )
}
