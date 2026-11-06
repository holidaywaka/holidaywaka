import dayjs from 'dayjs';
import { Calendar, People } from 'iconsax-reactjs';
import { staySummaryText } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelStay } from '~/routes/general/hotel-search/types';
import type { hotelProps } from '~/routes/general/hotel-page/types';
import { formatTime } from '~/routes/general/hotel-page/partials/hotel-overview';

type props = {
    open: () => void;
    hotel: hotelProps;
    stay: HotelStay | null;
}

/** Stay summary above the rooms: dates with the property's check-in / check-out times */
export default function ChangeCheckInOut(props: props) {
    const { hotel, stay } = props;
    const checkInFrom = formatTime(hotel.check_in_time);
    const checkInUntil = formatTime(hotel.check_in_time_end);
    const checkOutBefore = formatTime(hotel.check_out_time);

    const block = (label: string, icon: React.ReactNode, value: React.ReactNode, hint?: string | null) => (
        <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
            <div className="min-w-0">
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="font-semibold text-zinc-900">{value}</div>
                {hint && <div className="text-xs text-zinc-500">{hint}</div>}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200/70 p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {block('Check-in', <Calendar className="size-5" />, stay ? dayjs(stay.checkin).format('ddd, D MMM YYYY') : 'Select a date',
                        checkInFrom ? `From ${checkInFrom}${checkInUntil ? ` until ${checkInUntil}` : ''}` : null)}
                    {block('Check-out', <Calendar className="size-5" />, stay ? dayjs(stay.checkout).format('ddd, D MMM YYYY') : 'Select a date',
                        checkOutBefore ? `Until ${checkOutBefore}` : null)}
                    {block('Guests', <People className="size-5" />, stay ? staySummaryText(stay) : 'Select guests')}
                </div>
                <button type="button" onClick={props.open} className="shrink-0 h-11 px-5 rounded-lg border border-gray-300 bg-white font-semibold text-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer">
                    {stay ? 'Change' : 'Select dates'}
                </button>
            </div>
        </div>
    )
}
