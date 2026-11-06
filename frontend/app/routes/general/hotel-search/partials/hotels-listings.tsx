import React from 'react';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-reactjs';
import { MdCreditCard, MdEventAvailable, MdEventBusy, MdLocationOn, MdNoMeals, MdRestaurant, MdStorefront } from 'react-icons/md';
import Linked from '~/components/general/Linked';
import { ButtonSpinner, useIsNavigating } from '~/components/general/NavigationProgress';
import HotelImage from '~/components/hotels-components/hotel-image';
import StarRating from '~/components/hotels-components/star-rating';
import { hotelKindLabels, serpFilterIcons } from '~/routes/general/hotel-search/hotel-constants';
import { formatMoney, freeCancellationText, guestsCount, HotelMealLabels, hotelPageLink, humanizeSlug, plural } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelFilterReference, HotelSearchHotel, HotelStay } from '~/routes/general/hotel-search/types'

type props = {
    hotel: HotelSearchHotel;
    stay: HotelStay;
    nights: number;
    reference?: HotelFilterReference;
}

const MAX_FACILITY_ICONS = 7;

export default function HotelListings(props: props) {
    const hotel = props.hotel;
    const cheapest = hotel.rates[0];
    const link = hotelPageLink(hotel.hid, props.stay);
    const opening = useIsNavigating(link);
    const nights = Math.max(props.nights, 1);
    const guests = guestsCount(props.stay.guests);
    const amenityLabel = (value: string) => props.reference?.serp_filters.find((item) => item.value === value)?.desc ?? humanizeSlug(value);
    const facilities = hotel.serp_filters.filter((value) => serpFilterIcons[value]).slice(0, MAX_FACILITY_ICONS);
    const kind = hotel.kind ? hotelKindLabels[hotel.kind.toLowerCase()] ?? humanizeSlug(hotel.kind) : null;

    return (
        <article className="bg-white rounded-xl overflow-hidden flex flex-col md:flex-row border border-slate-200/70 hover:shadow-lg hover:shadow-slate-200/70 transition-shadow">
            <PhotoStepper images={hotel.images} name={hotel.name} link={link} badge={kind} />

            <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 space-y-0.5">
                        <StarRating stars={hotel.star_rating} className="size-3" />
                        <Linked to={link} className="block text-lg font-semibold leading-snug text-blue-700 hover:text-blue-900 hover:underline">{hotel.name}</Linked>
                        {hotel.address && <div className="flex items-start gap-1 text-sm text-zinc-600">
                            <MdLocationOn className="shrink-0 mt-0.5 text-zinc-400" aria-hidden />
                            <span>{hotel.address}</span>
                        </div>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 ml-auto">
                        {facilities.length > 0 && <div className="flex items-center gap-2 text-zinc-700">
                            {facilities.map((value) => {
                                const Icon = serpFilterIcons[value];
                                return <span key={value} title={amenityLabel(value)} aria-label={amenityLabel(value)}><Icon className="size-4.5" /></span>
                            })}
                            {hotel.serp_filters.length > facilities.length && <span className="text-xs text-zinc-500">+{hotel.serp_filters.length - facilities.length}</span>}
                        </div>}
                        <div className="text-xs text-zinc-500">{plural(hotel.rates_count, 'room option')}</div>
                    </div>
                </div>

                {cheapest && (
                    <div className="mt-auto rounded-lg bg-slate-50 p-3 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] gap-x-5 gap-y-3 items-start">
                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-zinc-500">Cheapest room</div>
                            <div className="font-semibold text-zinc-900 leading-snug">{cheapest.room_name ?? 'Room'}</div>
                        </div>
                        <RateConditions rate={cheapest} />
                        <div className="sm:text-right sm:row-start-1 sm:col-start-2 lg:col-start-3">
                            <div className="text-[11px] text-zinc-500">from</div>
                            <div className="text-2xl font-bold text-zinc-900 tabular-nums leading-tight">{formatMoney(hotel.min_price, hotel.currency)}</div>
                            <div className="text-xs text-zinc-600">for {plural(nights, 'night')} for {plural(guests, 'guest')}</div>
                            {nights > 1 && <div className="text-xs text-zinc-500 tabular-nums">{formatMoney(hotel.min_price / nights, hotel.currency)} / night</div>}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-zinc-500">
                        {hotel.has_free_cancellation && !freeCancellationText(cheapest?.payment ?? { free_cancellation_before: null }) && 'Other room options offer free cancellation'}
                    </div>
                    <Linked to={link} className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:scale-95 transition-all ${opening ? 'pointer-events-none opacity-80' : ''}`}>
                        {opening && <ButtonSpinner />} {opening ? 'Opening...' : 'Show rooms'}
                    </Linked>
                </div>
            </div>
        </article>
    )
}

function RateConditions({ rate }: { rate: HotelSearchHotel['rates'][number] }) {
    const hasMeal = rate.meal.category !== 'no_meal';
    const freeCancellation = Boolean(freeCancellationText(rate.payment));
    const payAtHotel = rate.payment.type === 'hotel';
    const item = (good: boolean, Icon: React.ComponentType<{ className?: string }>, text: string) => (
        <div className={`flex items-center gap-2 ${good ? 'text-green-700' : 'text-zinc-700'}`}>
            <Icon className="shrink-0 size-4" />
            <span>{text}</span>
        </div>
    );
    return (
        <div className="space-y-1 text-sm">
            {item(hasMeal, hasMeal ? MdRestaurant : MdNoMeals, hasMeal ? HotelMealLabels[rate.meal.category]?.label ?? 'Meals included' : 'No meals')}
            {item(freeCancellation, freeCancellation ? MdEventAvailable : MdEventBusy, freeCancellation ? 'Free cancellation' : 'No free cancellation')}
            {item(false, payAtHotel ? MdStorefront : MdCreditCard, payAtHotel ? 'Pay at the hotel' : 'Pay online')}
        </div>
    );
}

type stepperProps = {
    images: string[];
    name: string;
    link: string;
    badge: string | null;
}

/** Lightweight photo browser: one image at a time, arrows on hover, counter */
function PhotoStepper({ images, name, link, badge }: stepperProps) {
    const [index, setIndex] = React.useState(0);
    const count = images.length;
    const step = (delta: number) => (event: React.MouseEvent) => {
        event.preventDefault();
        setIndex((current) => (current + delta + count) % count);
    };

    return (
        <div className="group relative shrink-0 w-full md:w-72 lg:w-80 h-56 md:h-auto md:min-h-60 bg-slate-100">
            <Linked to={link} aria-label={name} className="absolute inset-0">
                <HotelImage image={images[index]} alt={name} className="size-full object-cover" />
            </Linked>
            {badge && <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-sm">{badge}</span>}
            {count > 1 && (
                <>
                    <button type="button" aria-label="Previous photo" onClick={step(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <ArrowLeft2 size={16} />
                    </button>
                    <button type="button" aria-label="Next photo" onClick={step(1)} className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <ArrowRight2 size={16} />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums">{index + 1} / {count}</span>
                </>
            )}
        </div>
    );
}
