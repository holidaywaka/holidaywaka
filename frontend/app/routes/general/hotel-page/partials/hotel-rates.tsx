import React from 'react'
import dayjs from 'dayjs'
import { useMutation, type UseQueryResult } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import { MdBed, MdCreditCard, MdEventAvailable, MdEventBusy, MdNoMeals, MdPhotoLibrary, MdRefresh, MdRestaurant, MdStorefront } from 'react-icons/md'
import { ArrowDown2 } from 'iconsax-reactjs'
import Formbutton from '~/components/general/Formbutton'
import { ButtonSpinner } from '~/components/general/NavigationProgress'
import HotelImage from '~/components/hotels-components/hotel-image'
import HotelPrebookModal from '~/routes/general/hotel-page/partials/hotel-prebook-modal'
import { createResponse, NewApis } from '~/services/new-apis'
import { roomAmenityIcons } from '~/routes/general/hotel-search/hotel-constants'
import { formatMoney, HotelMealLabels, HotelPaymentLabels, humanizeSlug, plural, stayPayload } from '~/routes/general/hotel-search/hotel-utils'
import type { HotelFilterReference, HotelMealCategory, HotelRate, HotelStay } from '~/routes/general/hotel-search/types'
import type { hotelPrebookProps, hotelProps, hotelRatesProps, hotelRoomGroupProps } from '~/routes/general/hotel-page/types'
import { useViewerCountry } from '~/routes/general/hotel-search/use-viewer-country'

type props = {
    hotel: hotelProps;
    stay: HotelStay | null;
    rates: UseQueryResult<hotelRatesProps>;
    reference?: HotelFilterReference;
    onChangeStay: () => void;
}

type RateFilters = { beds: string; meals: string; cancellation: string; payment: string }
const ALL = 'all'
const NO_FILTERS: RateFilters = { beds: ALL, meals: ALL, cancellation: ALL, payment: ALL }
const ROOM_AMENITY_CHIPS = 10
// Same column template for the header and every row
const TABLE_COLUMNS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_8.5rem]'

// ETG links rates to static room groups through identical rg_ext codes
function findRoomGroup(groups: hotelRoomGroupProps[], rate: HotelRate) {
    if (!rate.rg_ext) return undefined;
    return groups.find((group) => group.rg_ext && Object.entries(rate.rg_ext!).every(([key, value]) => group.rg_ext?.[key] === value));
}

const isFreeCancellation = (rate: HotelRate) => {
    const before = rate.payment.free_cancellation_before;
    return Boolean(before) && dayjs(before).isAfter(dayjs());
}
const paymentKind = (rate: HotelRate) => rate.payment.type === 'hotel' ? 'hotel' : 'online'

function matches(rate: HotelRate, filters: RateFilters) {
    return (filters.beds === ALL || rate.room.bedding_type === filters.beds) &&
        (filters.meals === ALL || rate.meal.category === filters.meals) &&
        (filters.cancellation === ALL || (filters.cancellation === 'free') === isFreeCancellation(rate)) &&
        (filters.payment === ALL || paymentKind(rate) === filters.payment)
}

export default function HotelRates(props: props) {
    const [selected, setSelected] = React.useState<HotelRate | null>(null);
    const [filters, setFilters] = React.useState<RateFilters>(NO_FILTERS);
    const { data, isLoading, isError, error, refetch, isFetching } = props.rates;
    const viewerCountry = useViewerCountry();

    const prebook = useMutation<hotelPrebookProps, Error, HotelRate>({
        // The stay must match the one the rates were fetched for; the server re-validates it
        mutationFn: (rate) => createResponse({
            endpoint: NewApis.hotels.prebook,
            method: 'POST',
            // Same viewer country as the rates request, so the guest is charged the price they saw
            data: { hid: props.hotel.hid, ...stayPayload(props.stay!, viewerCountry), book_hash: rate.book_hash },
        }),
    });

    const allRates = data?.rates ?? [];

    // Filter options only list values present in the current rates
    const options = React.useMemo(() => {
        const unique = <T,>(values: T[]) => [...new Set(values)];
        return {
            beds: unique(allRates.map((rate) => rate.room.bedding_type).filter((value): value is string => Boolean(value)))
                .map((value) => ({ value, label: humanizeSlug(value) })),
            meals: (Object.keys(HotelMealLabels) as HotelMealCategory[])
                .filter((category) => allRates.some((rate) => rate.meal.category === category))
                .map((value) => ({ value, label: HotelMealLabels[value].label })),
            cancellation: [
                ...(allRates.some(isFreeCancellation) ? [{ value: 'free', label: 'Free cancellation' }] : []),
                ...(allRates.some((rate) => !isFreeCancellation(rate)) ? [{ value: 'non_free', label: 'No free cancellation' }] : []),
            ],
            payment: [
                ...(allRates.some((rate) => paymentKind(rate) === 'online') ? [{ value: 'online', label: 'Pay now' }] : []),
                ...(allRates.some((rate) => paymentKind(rate) === 'hotel') ? [{ value: 'hotel', label: 'Pay at the hotel' }] : []),
            ],
        };
    }, [allRates]);

    const groups = React.useMemo(() => {
        const byRoom = new Map<string, HotelRate[]>();
        for (const rate of allRates) {
            if (!matches(rate, filters)) continue;
            const key = rate.room.main_name || rate.room_name || 'Room';
            byRoom.set(key, [...(byRoom.get(key) ?? []), rate]);
        }
        return [...byRoom.entries()];
    }, [allRates, filters]);

    const visibleCount = groups.reduce((total, [, rates]) => total + rates.length, 0);
    const isFiltered = Object.values(filters).some((value) => value !== ALL);

    function reserve(rate: HotelRate) {
        // A second click would start another prebook for the same guest
        if (prebook.isPending) return;
        setSelected(rate);
        prebook.mutate(rate);
    }

    function closeModal() {
        setSelected(null);
        prebook.reset();
    }

    function refreshRates() {
        closeModal();
        refetch();
    }

    return (
        <section id="hotel-rooms" className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 scroll-mt-28 space-y-4">
            <HotelPrebookModal
                opened={selected !== null}
                rate={selected}
                hotel={props.hotel}
                prebook={prebook}
                onClose={closeModal}
                onRefreshRates={refreshRates}
                reference={props.reference}
            />
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900">Available rooms</h2>
                    {data && <div className="text-sm text-zinc-500">
                        {plural(data.rates.length, 'option')} for {plural(data.search.nights, 'night')}, {plural(data.search.total_guests, 'guest')} · prices are for the whole stay
                    </div>}
                </div>
            </div>

            {!props.stay && (
                <div className="text-center space-y-3 py-6 text-sm">
                    <div>Select your dates and guests to see available rooms and prices.</div>
                    <div className="w-fit mx-auto"><Formbutton title="Select dates" type="button" onClick={props.onChangeStay} /></div>
                </div>
            )}

            {props.stay && isLoading && (
                <div className="space-y-2">
                    <div className="text-sm text-zinc-500">Checking live availability...</div>
                    <Skeleton count={3} height={110} borderRadius={12} className="mb-2" />
                </div>
            )}

            {props.stay && isError && (
                <div className="text-center space-y-3 py-6 text-sm">
                    <div className="text-red-600">{error?.message || 'We could not load rooms for this hotel.'}</div>
                    <div className="w-fit mx-auto"><Formbutton title="Try again" type="button" loading={isFetching} onClick={() => refetch()} /></div>
                </div>
            )}

            {data && data.rates.length === 0 && (
                <div className="text-center space-y-3 py-6 text-sm">
                    <div>No rooms are available for these dates.</div>
                    <div className="w-fit mx-auto"><Formbutton title="Change dates" type="button" onClick={props.onChangeStay} /></div>
                </div>
            )}

            {data && data.rates.length > 0 && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <RateFilterSelect label="Beds" value={filters.beds} options={options.beds} onChange={(beds) => setFilters({ ...filters, beds })} />
                        <RateFilterSelect label="Meals" value={filters.meals} options={options.meals} onChange={(meals) => setFilters({ ...filters, meals })} />
                        <RateFilterSelect label="Cancellation policy" value={filters.cancellation} options={options.cancellation} onChange={(cancellation) => setFilters({ ...filters, cancellation })} />
                        <RateFilterSelect label="Payment" value={filters.payment} options={options.payment} onChange={(payment) => setFilters({ ...filters, payment })} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-zinc-600">{isFiltered ? `${plural(visibleCount, 'option')} match your choices` : `Showing all ${plural(allRates.length, 'option')}`}</span>
                        <div className="flex items-center gap-3">
                            {isFiltered && <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-semibold text-primary hover:underline cursor-pointer">Reset</button>}
                            <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-slate-200 font-medium text-zinc-800 hover:border-zinc-400 cursor-pointer disabled:opacity-60">
                                <MdRefresh className={isFetching ? 'animate-spin' : ''} /> Refresh rates
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {data && data.rates.length > 0 && visibleCount === 0 && (
                <div className="text-center text-sm py-6 space-y-2">
                    <div>No room options match these choices.</div>
                    <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-semibold text-primary hover:underline cursor-pointer">Show all rooms</button>
                </div>
            )}

            <div className={`space-y-5 ${isFetching && !isLoading ? 'opacity-60' : ''} transition-opacity`}>
                {groups.map(([name, rates]) => (
                    <RoomGroup
                        key={name}
                        name={name}
                        rates={rates}
                        group={findRoomGroup(props.hotel.room_groups, rates[0])}
                        nights={data?.search.nights ?? 1}
                        reference={props.reference}
                        onReserve={reserve}
                        reservingHash={prebook.isPending ? selected?.book_hash : undefined}
                    />
                ))}
            </div>
        </section>
    )
}

function RateFilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
    return (
        <label className="relative block rounded-lg bg-white border border-slate-200 px-3 pt-1.5 pb-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <span className="block text-xs text-zinc-500">{label}</span>
            <select
                value={value}
                disabled={options.length === 0}
                onChange={(event) => onChange(event.target.value)}
                className={`w-full appearance-none bg-transparent pr-6 text-sm outline-none cursor-pointer ${value === ALL ? 'text-zinc-500' : 'font-semibold text-zinc-900'}`}>
                <option value={ALL}>All options</option>
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <ArrowDown2 className="pointer-events-none absolute right-3 bottom-2.5 size-4 text-zinc-500" />
        </label>
    )
}

type RoomGroupProps = {
    name: string;
    rates: HotelRate[];
    group?: hotelRoomGroupProps;
    nights: number;
    reference?: HotelFilterReference;
    onReserve: (rate: HotelRate) => void;
    reservingHash?: string;
}

function RoomGroup({ name, rates, group, nights, reference, onReserve, reservingHash }: RoomGroupProps) {
    const amenityLabel = (value: string) => reference?.room_amenities.find((item) => item.value === value)?.desc ?? humanizeSlug(value);
    const amenities = group?.room_amenities ?? [];
    const photos = group?.images ?? [];
    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 p-3 bg-white">
                <div className="relative shrink-0 w-full sm:w-44 h-40 sm:h-28 rounded-lg overflow-hidden">
                    <HotelImage image={photos[0]?.url} alt={name} placeholderText="No room photo" className="size-full object-cover" />
                    {photos.length > 1 && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-blue-700"><MdPhotoLibrary /> {photos.length} photos</span>}
                </div>
                <div className="min-w-0 space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900">{name}</h3>
                    {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {amenities.slice(0, ROOM_AMENITY_CHIPS).map((amenity) => {
                                const Icon = roomAmenityIcons[amenity];
                                return (
                                    <span key={amenity} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs text-zinc-700">
                                        {Icon && <Icon className="size-4 text-zinc-600" />}{amenityLabel(amenity)}
                                    </span>
                                )
                            })}
                            {amenities.length > ROOM_AMENITY_CHIPS && <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-zinc-500" title={amenities.slice(ROOM_AMENITY_CHIPS).map(amenityLabel).join(', ')}>+{amenities.length - ROOM_AMENITY_CHIPS} more</span>}
                        </div>
                    )}
                </div>
            </div>

            <div className={`hidden md:grid ${TABLE_COLUMNS} bg-zinc-800 text-white text-xs font-medium`}>
                {['Room', 'Meals', 'Cancellation', 'Total price', 'Payment', ''].map((title, index) => (
                    <div key={index} className={`px-3 py-2 ${index > 0 ? 'border-l border-white/10' : ''}`}>{title}</div>
                ))}
            </div>
            <div className="divide-y divide-slate-200">
                {rates.map((rate, index) => (
                    <RateRow key={rate.book_hash} rate={rate} nights={nights} reference={reference} striped={index % 2 === 1} onReserve={() => onReserve(rate)} reserving={reservingHash === rate.book_hash} />
                ))}
            </div>
        </div>
    )
}

type RateRowProps = {
    rate: HotelRate;
    nights: number;
    striped: boolean;
    reference?: HotelFilterReference;
    onReserve: () => void;
    reserving?: boolean;
}

function RateRow({ rate, nights, striped, reference, onReserve, reserving }: RateRowProps) {
    const payment = rate.payment;
    const free = isFreeCancellation(rate);
    const hasMeal = rate.meal.category !== 'no_meal';
    const payAtHotel = payment.type === 'hotel';
    const payAtHotelTaxes = payment.taxes.filter((tax) => !tax.included_by_supplier);
    const taxLabel = (name: string) => reference?.taxes.find((item) => item.value === name)?.desc ?? humanizeSlug(name);
    const extras = rate.amenities.slice(0, 3).map((value) => reference?.room_amenities.find((item) => item.value === value)?.desc ?? humanizeSlug(value));
    const cell = (label: string, children: React.ReactNode, className = 'md:border-l md:border-slate-200') => (
        <div className={`px-3 py-1 md:py-3 ${className}`}>
            <div className="md:hidden text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
            {children}
        </div>
    );

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${TABLE_COLUMNS} py-2 md:py-0 text-sm ${striped ? 'bg-slate-50' : 'bg-white'}`}>
            {cell('Room', <div className="space-y-0.5">
                {rate.room.bedding_type && <div className="flex items-center gap-1.5 text-zinc-800"><MdBed className="size-5 text-zinc-600" />{humanizeSlug(rate.room.bedding_type)}</div>}
                <div className="text-zinc-600">{rate.room_name}</div>
                {extras.length > 0 && <div className="text-xs text-zinc-500">{extras.join(' · ')}</div>}
                {rate.allotment !== null && rate.allotment > 0 && rate.allotment <= 3 && <div className="text-xs font-medium text-red-600">Only {plural(rate.allotment, 'room')} left at this price</div>}
            </div>, 'sm:col-span-2 md:col-span-1')}

            {cell('Meals', <div className={`flex items-start gap-1.5 ${hasMeal ? 'text-green-700' : 'text-zinc-700'}`}>
                {hasMeal ? <MdRestaurant className="shrink-0 mt-0.5" /> : <MdNoMeals className="shrink-0 mt-0.5" />}
                <span>{hasMeal ? HotelMealLabels[rate.meal.category]?.label : 'Meals are not included'}{rate.meal.no_child_meal && hasMeal ? <span className="block text-xs text-zinc-500">Children's meals not included</span> : null}</span>
            </div>)}

            {cell('Cancellation', <div className={`flex items-start gap-1.5 ${free ? 'text-green-700' : 'text-zinc-700'}`}>
                {free ? <MdEventAvailable className="shrink-0 mt-0.5" /> : <MdEventBusy className="shrink-0 mt-0.5" />}
                <span>{free
                    ? <>Free cancellation<span className="block text-xs text-zinc-500">until {dayjs(payment.free_cancellation_before).format('D MMM YYYY, h:mm A')}</span></>
                    : 'No free cancellation'}</span>
            </div>)}

            {cell('Total price', <div>
                <div className="text-lg font-bold text-zinc-900 tabular-nums">{formatMoney(payment.show_amount, payment.show_currency)}</div>
                <div className="text-xs text-zinc-500 tabular-nums">{formatMoney(payment.show_amount / Math.max(nights, 1), payment.show_currency)} / night</div>
                {payAtHotelTaxes.map((tax, index) => (
                    <div key={index} className="text-xs text-amber-700">+ {formatMoney(tax.amount, tax.currency)} {taxLabel(tax.name)} at the hotel</div>
                ))}
                {rate.deposit && <div className="text-xs text-amber-700">{rate.deposit.is_refundable ? 'Refundable' : 'Non-refundable'} deposit {formatMoney(rate.deposit.amount, rate.deposit.currency)}</div>}
            </div>)}

            {cell('Payment', <div className={`flex items-start gap-1.5 ${payAtHotel ? 'text-zinc-700' : 'text-green-700'}`}>
                {payAtHotel ? <MdStorefront className="shrink-0 mt-0.5" /> : <MdCreditCard className="shrink-0 mt-0.5" />}
                <span>{HotelPaymentLabels[payment.type] ?? humanizeSlug(payment.type)}{payment.is_need_credit_card_data && <span className="block text-xs text-zinc-500">Card details required</span>}</span>
            </div>)}

            <div className="px-3 py-2 md:py-3 md:border-l md:border-slate-200 flex md:items-center sm:col-span-2 md:col-span-1">
                <button type="button" onClick={onReserve} disabled={reserving} className="w-full h-11 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                    {reserving && <ButtonSpinner />} {reserving ? 'Checking...' : 'Reserve'}
                </button>
            </div>
        </div>
    )
}
