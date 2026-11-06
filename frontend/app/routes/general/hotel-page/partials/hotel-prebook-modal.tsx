import React from 'react'
import dayjs from 'dayjs'
import { Modal } from '@mantine/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router'
import Formbutton from '~/components/general/Formbutton'
import { useIsNavigating } from '~/components/general/NavigationProgress'
import { modalStyle } from '~/components/utils'
import { formatMoney, HotelMealLabels, HotelPaymentLabels, humanizeSlug, plural, staySummaryText } from '~/routes/general/hotel-search/hotel-utils'
import type { HotelCancellationPolicy, HotelFilterReference, HotelRate } from '~/routes/general/hotel-search/types'
import type { hotelPrebookProps, hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    opened: boolean;
    rate: HotelRate | null;
    hotel: hotelProps;
    prebook: UseMutationResult<hotelPrebookProps, Error, HotelRate>;
    reference?: HotelFilterReference;
    onClose: () => void;
    onRefreshRates: () => void;
}

const formatDate = (value: string | null) => value ? dayjs(value).format('MMM D, YYYY h:mm A') : null;

function policyText(policy: HotelCancellationPolicy, currency: string) {
    const penalty = policy.amount_show ? `cancellation fee ${formatMoney(policy.amount_show, currency)}` : 'free cancellation';
    const start = formatDate(policy.start_at);
    const end = formatDate(policy.end_at);
    if (start && end) return `${start} – ${end}: ${penalty}`;
    if (end) return `Until ${end}: ${penalty}`;
    if (start) return `From ${start}: ${penalty}`;
    return `Any time: ${penalty}`;
}

export default function HotelPrebookModal(props: props) {
    const { data, error, isPending } = props.prebook;
    const [acceptedPrice, setAcceptedPrice] = React.useState(false);
    const navigate = useNavigate();
    const isNavigating = useIsNavigating();

    React.useEffect(() => { setAcceptedPrice(false) }, [data?.id]);

    const rate = data?.rate;
    const payment = rate?.payment;
    const payAtHotelTaxes = payment?.taxes.filter((tax) => !tax.included_by_supplier) ?? [];
    const taxLabel = (name: string) => props.reference?.taxes.find((item) => item.value === name)?.desc ?? humanizeSlug(name);
    const needsPriceConsent = Boolean(data?.price_changed);
    const nights = data ? dayjs(data.checkout).diff(dayjs(data.checkin), 'day') : 0;

    return (
        <Modal opened={props.opened} onClose={props.onClose} withCloseButton={false} styles={modalStyle} size="lg" centered>
            <div className="p-3 md:p-4 lg:p-5 text-sm relative">
                <div onClick={props.onClose} className="absolute top-3 right-3 cursor-pointer active:scale-95 transition-all text-2xl"> <FiX /> </div>
                <div className="text-lg font-bold mb-1">{props.hotel.name}</div>
                <div className="text-zinc-500 mb-4">{props.rate?.room_name}</div>

                {isPending && (
                    <div className="py-8 text-center space-y-2">
                        <div className="loading-wave mx-auto w-fit">
                            <div className="loading-bar"></div>
                            <div className="loading-bar"></div>
                            <div className="loading-bar"></div>
                            <div className="loading-bar"></div>
                        </div>
                        <div>Confirming availability and price with the hotel...</div>
                    </div>
                )}

                {error && (
                    <div className="py-6 text-center space-y-3">
                        <div className="text-red-600">{error.message}</div>
                        <div className="w-fit mx-auto"><Formbutton title="Refresh rooms" type="button" onClick={props.onRefreshRates} /></div>
                    </div>
                )}

                {data && rate && payment && (
                    <div className="space-y-3">
                        <div className={`p-3 rounded-md ${needsPriceConsent ? 'bg-amber-50 border border-amber-300' : 'bg-green-50 border border-green-300'}`}>
                            {needsPriceConsent ? (
                                <>
                                    <div className="font-bold text-amber-800">The price for this room has changed</div>
                                    <div>
                                        {data.original_amount !== null && <span className="line-through text-zinc-500 mr-2">{formatMoney(data.original_amount, data.currency)}</span>}
                                        <span className="font-bold">{formatMoney(data.amount, data.currency)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="font-bold text-green-800">Good news, this room is available at the price shown</div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs text-zinc-500">Check-in</div>
                                <div className="font-semibold">{dayjs(data.checkin).format('ddd, D MMM YYYY')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-500">Check-out</div>
                                <div className="font-semibold">{dayjs(data.checkout).format('ddd, D MMM YYYY')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-500">Guests</div>
                                <div className="font-semibold">{staySummaryText(data)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-500">Meals</div>
                                <div className="font-semibold">{HotelMealLabels[rate.meal.category]?.label}</div>
                            </div>
                        </div>

                        <div>
                            <div className="font-bold">Cancellation policy</div>
                            {payment.cancellation_policies.length === 0
                                ? <div className="text-zinc-600">No cancellation details provided</div>
                                : payment.cancellation_policies.map((policy, index) => (
                                    <div key={index} className="text-zinc-600">{policyText(policy, payment.show_currency)}</div>
                                ))}
                            <div className="text-xs text-zinc-400">Times shown in your local time zone</div>
                        </div>

                        {(payAtHotelTaxes.length > 0 || rate.deposit || (rate.no_show?.amount ?? 0) > 0) && <div>
                            <div className="font-bold">Payable at the hotel</div>
                            {payAtHotelTaxes.map((tax, index) => (
                                <div key={index} className="text-zinc-600">{taxLabel(tax.name)}: {formatMoney(tax.amount, tax.currency)}</div>
                            ))}
                            {rate.deposit && <div className="text-zinc-600">{rate.deposit.is_refundable ? 'Refundable' : 'Non-refundable'} deposit: {formatMoney(rate.deposit.amount, rate.deposit.currency)}</div>}
                            {(rate.no_show?.amount ?? 0) > 0 && <div className="text-zinc-600">No-show fee: {formatMoney(rate.no_show!.amount, rate.no_show!.currency)}</div>}
                        </div>}

                        <div className="bg-zinc-100 p-3 rounded-md flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs text-zinc-500">Total for {plural(nights, 'night')} · {HotelPaymentLabels[payment.type] ?? humanizeSlug(payment.type)}</div>
                                <div className="text-xl font-bold">{formatMoney(data.amount, data.currency)}</div>
                            </div>
                            <div className="text-xs text-zinc-500 text-right">Held until {dayjs(data.expires_at).format('h:mm A')}</div>
                        </div>

                        {needsPriceConsent && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" className="mt-1" checked={acceptedPrice} onChange={(e) => setAcceptedPrice(e.target.checked)} />
                                <span>I accept the updated price of {formatMoney(data.amount, data.currency)}</span>
                            </label>
                        )}

                        {payment.type === 'hotel' ? (
                            <div className="p-3 rounded-md bg-zinc-100 text-zinc-700">This rate is paid directly at the hotel and can't be booked online yet. Please choose a rate marked "Pay now".</div>
                        ) : (
                            <Formbutton
                                title="Continue to booking"
                                type="button"
                                disabled={needsPriceConsent && !acceptedPrice}
                                loading={isNavigating}
                                onClick={() => navigate(`/hotel-checkout/${data.id}`)}
                            />
                        )}
                    </div>
                )}
            </div>
        </Modal>
    )
}
