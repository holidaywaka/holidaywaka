import { MdLocationOn } from 'react-icons/md';
import StarRating from '~/components/hotels-components/star-rating';
import { hotelKindLabels } from '~/routes/general/hotel-search/hotel-constants';
import { formatMoney, humanizeSlug, plural } from '~/routes/general/hotel-search/hotel-utils';
import type { hotelProps, hotelRatesProps } from '~/routes/general/hotel-page/types'

type props = {
    hotel: hotelProps;
    rates?: hotelRatesProps;
    onShowRooms: () => void;
}
export default function HotelTitleDisplay(props: props) {
    const hotel = props.hotel;
    // Rates are sorted by price server-side
    const cheapest = props.rates?.rates[0]?.payment;
    const kind = hotel.kind ? hotelKindLabels[hotel.kind.toLowerCase()] ?? humanizeSlug(hotel.kind) : null;
    const location = [hotel.address, hotel.region?.name].filter(Boolean).join(', ');
    return (
        <div id="hotel-overview" className="rounded-xl bg-white border border-slate-200/70 p-4 md:p-5 scroll-mt-28">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <StarRating stars={hotel.star_rating} />
                        {kind && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">{kind}</span>}
                        {hotel.hotel_chain && hotel.hotel_chain !== 'No chain' && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">{hotel.hotel_chain}</span>}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 leading-tight">{hotel.name}</h1>
                    {location && <div className="flex items-start gap-1 text-sm text-zinc-600">
                        <MdLocationOn className="shrink-0 mt-0.5 text-zinc-400" aria-hidden />
                        <span>{location}{hotel.postal_code ? ` ${hotel.postal_code}` : ''}</span>
                    </div>}
                    {hotel.is_closed && <div className="text-sm font-medium text-red-600">This property is currently not accepting guests</div>}
                </div>
                <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2">
                    {cheapest ? (
                        <div className="md:text-right">
                            <div className="text-sm text-zinc-600">from <span className="text-2xl font-bold text-zinc-900 tabular-nums">{formatMoney(cheapest.show_amount, cheapest.show_currency)}</span></div>
                            {props.rates && <div className="text-xs text-zinc-500">for {plural(props.rates.search.nights, 'night')}, {plural(props.rates.search.total_guests, 'guest')}</div>}
                        </div>
                    ) : <div className="text-sm text-zinc-500">{props.rates ? 'No rooms for these dates' : 'Select dates to see prices'}</div>}
                    <button type="button" onClick={props.onShowRooms} className="h-11 px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer">
                        Show rooms
                    </button>
                </div>
            </div>
        </div>
    )
}
