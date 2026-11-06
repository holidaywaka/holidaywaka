import React from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import Skeleton from 'react-loading-skeleton'
import { MdBed, MdCheckCircle, MdDownload, MdErrorOutline, MdEventAvailable, MdEventBusy, MdHourglassTop, MdRestaurant } from 'react-icons/md'
import { createResponse, downloadFile, NewApis } from '~/services/new-apis'
import { formatMoney, plural } from '~/routes/general/hotel-search/hotel-utils'
import type { hotelBookingProps, hotelBookingStatus } from '~/routes/general/hotel-page/types'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage('Your Hotel Booking')
}

const STATUS_VIEW: Record<hotelBookingStatus, { label: string; tone: string; icon: React.ComponentType<{ className?: string }>; text: string }> = {
    awaiting_payment: { label: 'Awaiting payment', tone: 'bg-amber-50 border-amber-200 text-amber-900', icon: MdHourglassTop, text: "Your room is reserved for checkout. We'll confirm it with the hotel as soon as your payment is received." },
    payment_declined: { label: 'Payment declined', tone: 'bg-red-50 border-red-200 text-red-900', icon: MdErrorOutline, text: 'Your payment did not go through, so the room was not booked. Please search again and choose another payment method.' },
    booking: { label: 'Confirming with the hotel', tone: 'bg-blue-50 border-blue-200 text-blue-900', icon: MdHourglassTop, text: 'Payment received. We are confirming your room with the hotel; this usually takes under a minute.' },
    confirmed: { label: 'Booking confirmed', tone: 'bg-green-50 border-green-200 text-green-900', icon: MdCheckCircle, text: 'Your booking is confirmed. Download your voucher and show it at check-in with the lead guest\'s passport.' },
    failed: { label: 'Not confirmed', tone: 'bg-red-50 border-red-200 text-red-900', icon: MdErrorOutline, text: 'The hotel could not confirm this room. Our team has been alerted and will contact you about an alternative or a full refund.' },
    needs_attention: { label: 'Under review', tone: 'bg-amber-50 border-amber-200 text-amber-900', icon: MdHourglassTop, text: 'Your payment was received, but the hotel changed its price or availability. Our team is reviewing it and will contact you shortly.' },
    cancelled: { label: 'Cancelled', tone: 'bg-slate-100 border-slate-200 text-zinc-800', icon: MdEventBusy, text: 'This booking has been cancelled. Any refund due will be processed to your original payment method.' },
}

const PENDING: hotelBookingStatus[] = ['awaiting_payment', 'booking']

export default function HotelBookingPage() {
    const { id = '' } = useParams()
    const [downloading, setDownloading] = React.useState(false)
    const [downloadError, setDownloadError] = React.useState('')

    const { data, isLoading, isError, error } = useQuery<hotelBookingProps>({
        queryKey: ['hotel-booking', id],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.single_booking(id) }),
        enabled: Boolean(id),
        // Follow the booking while payment or the hotel confirmation is in progress
        refetchInterval: (query) => (query.state.data && PENDING.includes(query.state.data.status) ? 5000 : false),
        retry: false,
    })

    async function voucher() {
        setDownloading(true)
        setDownloadError('')
        try {
            await downloadFile(NewApis.hotels.booking_voucher(id), `voucher-${data?.reference}.pdf`)
        } catch (err) {
            setDownloadError((err as Error).message)
        } finally {
            setDownloading(false)
        }
    }

    if (isLoading) return <div className="w-[95%] max-w-4xl mx-auto py-8 space-y-3"><Skeleton height={120} borderRadius={12} /><Skeleton height={360} borderRadius={12} /></div>
    if (isError || !data) return (
        <div className="w-[95%] max-w-xl mx-auto py-16 text-center space-y-3">
            <div className="text-xl font-bold">Booking not found</div>
            <div className="text-zinc-600">{(error as Error)?.message}</div>
            <Link to="/hotels" className="inline-flex h-11 items-center px-5 rounded-lg bg-primary text-white font-semibold">Search hotels</Link>
        </div>
    )

    const view = STATUS_VIEW[data.status]
    const transaction = data.transaction
    const payment = data.rate?.payment
    const hotelTaxes = (payment?.taxes ?? []).filter((tax) => !tax.included_by_supplier)
    const totalGuests = data.guests.reduce((sum, room) => sum + room.adults + room.children.length, 0)

    return (
        <div className="w-[95%] max-w-4xl mx-auto py-6 space-y-4">
            <div className={`rounded-xl border p-4 md:p-5 ${view.tone}`}>
                <div className="flex items-start gap-3">
                    <view.icon className={`shrink-0 size-7 ${PENDING.includes(data.status) ? 'animate-pulse' : ''}`} />
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wide">{view.label}</div>
                        <h1 className="text-xl md:text-2xl font-bold">{data.hotel_name}</h1>
                        <p className="mt-1 text-sm">{data.status === 'failed' && data.failure_reason ? `${view.text} (${data.failure_reason})` : view.text}</p>
                        <div className="mt-2 text-sm">Booking reference <span className="font-bold">{data.reference}</span>{data.hotel_confirmation_number && <> · Hotel confirmation <span className="font-bold">{data.hotel_confirmation_number}</span></>}</div>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {data.has_voucher && (
                        <button type="button" onClick={voucher} disabled={downloading} className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white font-semibold cursor-pointer disabled:opacity-60">
                            <MdDownload /> {downloading ? 'Preparing voucher...' : 'Download voucher'}
                        </button>
                    )}
                    {data.status === 'awaiting_payment' && transaction?.payment_url && (
                        <a href={transaction.payment_url} className="inline-flex items-center h-11 px-5 rounded-lg bg-primary text-white font-semibold">Continue to Unified Payment</a>
                    )}
                    {data.status === 'awaiting_payment' && transaction?.upload_url && (
                        <Link to={transaction.upload_url} className="inline-flex items-center h-11 px-5 rounded-lg bg-primary text-white font-semibold">Upload payment slip</Link>
                    )}
                </div>
                {downloadError && <div className="mt-2 text-sm text-red-700">{downloadError}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-white rounded-xl border border-slate-200/70 p-4 text-sm space-y-3">
                    <h2 className="font-bold text-zinc-900">Your stay</h2>
                    {data.hotel_address && <div className="text-zinc-600">{[data.hotel_address, data.region_name].filter(Boolean).join(', ')}</div>}
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                        <div><div className="text-xs text-zinc-500">Check-in</div><div className="font-semibold">{dayjs(data.checkin).format('ddd, D MMM YYYY')}</div></div>
                        <div><div className="text-xs text-zinc-500">Check-out</div><div className="font-semibold">{dayjs(data.checkout).format('ddd, D MMM YYYY')}</div></div>
                    </div>
                    <div className="text-zinc-700">{plural(data.nights, 'night')} · {plural(data.guests.length, 'room')} · {plural(totalGuests, 'guest')}</div>
                    <div className="flex items-start gap-2"><MdBed className="shrink-0 mt-0.5" /><span className="font-semibold">{data.room_name}</span></div>
                    {data.meal && <div className="flex items-center gap-2"><MdRestaurant className="shrink-0" />{data.meal}</div>}
                    <div className="flex items-start gap-2">
                        {data.free_cancellation_before ? <MdEventAvailable className="shrink-0 mt-0.5 text-green-700" /> : <MdEventBusy className="shrink-0 mt-0.5" />}
                        <span>{data.free_cancellation_before ? `Free cancellation until ${dayjs(data.free_cancellation_before).format('D MMM YYYY, h:mm A')}` : 'Non-refundable'}</span>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200/70 p-4 text-sm space-y-3">
                    <h2 className="font-bold text-zinc-900">Guests</h2>
                    {data.rooms.map((room, index) => (
                        <div key={index}>
                            <div className="text-xs text-zinc-500">Room {index + 1}</div>
                            <div>{room.guests.map((guest) => `${guest.first_name} ${guest.last_name}${guest.is_child ? ` (child, ${guest.age})` : ''}`).join(', ')}</div>
                        </div>
                    ))}
                    <div className="border-t border-slate-200 pt-3 space-y-1">
                        <h2 className="font-bold text-zinc-900">Payment</h2>
                        {data.discount > 0 && <div className="flex justify-between text-green-700"><span>Voucher {data.voucher_code}</span><span>- {formatMoney(data.discount, data.currency)}</span></div>}
                        <div className="flex justify-between font-semibold"><span>Total paid online</span><span className="tabular-nums">{formatMoney(data.amount, data.currency)}</span></div>
                        {transaction && <div className="text-xs text-zinc-500">{transaction.payment_type === 'UNIFIED_PAYMENT_TRANSFER' ? 'Unified Payment checkout' : 'Bank transfer'} · {transaction.payment_status}</div>}
                        {hotelTaxes.length > 0 && (
                            <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                                <div className="font-semibold">Payable at the hotel</div>
                                {hotelTaxes.map((tax, index) => <div key={index}>{tax.name.replace(/_/g, ' ')}: {formatMoney(tax.amount, tax.currency)}</div>)}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
