import React from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import Skeleton from 'react-loading-skeleton'
import { MdBed, MdEventAvailable, MdEventBusy, MdLock, MdRestaurant } from 'react-icons/md'
import HotelImage from '~/components/hotels-components/hotel-image'
import StarRating from '~/components/hotels-components/star-rating'
import PaymentOptions from '~/components/payment/payment-options'
import VoucherInput, { type VoucherPreview } from '~/components/payment/voucher-input'
import { PAYMENT_METHODS } from '~/components/payment/enums'
import { createResponse, NewApis } from '~/services/new-apis'
import { formatMoney, HotelMealLabels, hotelPageLink, humanizeSlug, plural } from '~/routes/general/hotel-search/hotel-utils'
import type { hotelPrebookProps, hotelProps } from '~/routes/general/hotel-page/types'
import { privatePage } from '~/services/seo'
import { ButtonSpinner } from '~/components/general/NavigationProgress'

export function meta() {
    return privatePage('Complete Your Hotel Booking')
}

type GuestName = { first_name: string; last_name: string }
type RoomGuests = { adults: GuestName[]; children: GuestName[] }

const emptyName = (): GuestName => ({ first_name: '', last_name: '' })
// Letters (any script), spaces and '-,.’ only — the supplier rejects anything else
const NAME_PATTERN = /^[\p{L}\s'\-,.’]{1,50}$/u

function useCountdown(until?: string) {
    const [now, setNow] = React.useState(() => Date.now())
    React.useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])
    if (!until) return null
    const remaining = Math.max(0, new Date(until).getTime() - now)
    return { remaining, label: `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}` }
}

export default function HotelCheckout() {
    const { id = '' } = useParams()
    const navigate = useNavigate()

    const prebook = useQuery<hotelPrebookProps>({
        queryKey: ['hotel-prebook', id],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.single_prebook(id) }),
        enabled: Boolean(id),
        retry: false,
    })
    const hid = prebook.data?.hid
    const hotel = useQuery<hotelProps>({
        queryKey: ['hotel-content', hid],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.single(hid!) }),
        enabled: Boolean(hid),
        staleTime: 60 * 60 * 1000,
    })

    const [contact, setContact] = React.useState({ first_name: '', last_name: '', email: '', phone: '' })
    const [leadIsGuest, setLeadIsGuest] = React.useState(true)
    const [rooms, setRooms] = React.useState<RoomGuests[]>([])
    const [comment, setComment] = React.useState('')
    const [voucher, setVoucher] = React.useState<VoucherPreview | null>(null)
    const [paymentMethod, setPaymentMethod] = React.useState('')
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [submitError, setSubmitError] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const submitLock = React.useRef(false)

    // One name slot per searched guest
    React.useEffect(() => {
        if (!prebook.data) return
        setRooms(prebook.data.guests.map((room) => ({
            adults: Array.from({ length: room.adults }, emptyName),
            children: room.children.map(emptyName),
        })))
    }, [prebook.data?.id])

    const countdown = useCountdown(prebook.data?.expires_at)
    const expired = Boolean(prebook.data?.is_expired) || countdown?.remaining === 0

    if (prebook.isLoading) return (
        <div className="w-[95%] md:w-11/12 max-w-6xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5">
            <Skeleton height={600} borderRadius={12} />
            <Skeleton height={420} borderRadius={12} />
        </div>
    )

    if (prebook.isError || !prebook.data) return (
        <div className="w-[95%] max-w-xl mx-auto py-16 text-center space-y-3">
            <div className="text-xl font-bold">We couldn't find this reservation</div>
            <div className="text-zinc-600">{(prebook.error as Error)?.message ?? 'Please choose your room again.'}</div>
            <Link to="/hotels" className="inline-flex h-11 items-center px-5 rounded-lg bg-primary text-white font-semibold">Search hotels</Link>
        </div>
    )

    const data = prebook.data
    const rate = data.rate
    const payment = rate.payment
    const nights = dayjs(data.checkout).diff(dayjs(data.checkin), 'day')
    const totalGuests = data.guests.reduce((sum, room) => sum + room.adults + room.children.length, 0)
    const hotelTaxes = payment.taxes.filter((tax) => !tax.included_by_supplier)
    const freeUntil = payment.free_cancellation_before && dayjs(payment.free_cancellation_before).isAfter(dayjs()) ? payment.free_cancellation_before : null
    const payable = voucher ? voucher.payable : data.amount
    const backToHotel = hotelPageLink(data.hid, { checkin: data.checkin, checkout: data.checkout, residency: data.residency, guests: data.guests })

    function setGuest(roomIndex: number, kind: 'adults' | 'children', index: number, field: keyof GuestName, value: string) {
        setRooms((current) => current.map((room, i) => i !== roomIndex ? room : {
            ...room,
            [kind]: room[kind].map((guest, j) => j === index ? { ...guest, [field]: value } : guest),
        }))
    }

    // The lead guest fills room 1's first adult unless they are booking for someone else
    const effectiveRooms = rooms.map((room, roomIndex) => roomIndex === 0 && leadIsGuest
        ? { ...room, adults: [{ first_name: contact.first_name, last_name: contact.last_name }, ...room.adults.slice(1)] }
        : room)

    function validate() {
        const next: Record<string, string> = {}
        const name = (value: string) => value.trim() && NAME_PATTERN.test(value.trim())
        if (!name(contact.first_name)) next['contact.first_name'] = 'Enter a first name using letters only'
        if (!name(contact.last_name)) next['contact.last_name'] = 'Enter a last name using letters only'
        if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) next['contact.email'] = 'Enter a valid email address'
        if (contact.phone.replace(/\D/g, '').length < 7) next['contact.phone'] = 'Enter a valid phone number with country code'
        effectiveRooms.forEach((room, roomIndex) => {
            room.adults.forEach((guest, index) => {
                if (!name(guest.first_name) || !name(guest.last_name)) next[`room.${roomIndex}.adult.${index}`] = 'Enter the first and last name as on the passport'
            })
            room.children.forEach((guest, index) => {
                const partial = Boolean(guest.first_name.trim()) !== Boolean(guest.last_name.trim())
                if (partial || (guest.first_name.trim() && (!name(guest.first_name) || !name(guest.last_name)))) next[`room.${roomIndex}.child.${index}`] = 'Enter both names, or leave both empty'
            })
        })
        if (!paymentMethod) next.payment = 'Select how you would like to pay'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        // Enter key or a fast second click must not create a second booking
        if (submitLock.current) return
        setSubmitError('')
        if (!validate()) {
            document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }
        submitLock.current = true
        setSubmitting(true)
        try {
            const response = await createResponse({
                endpoint: NewApis.hotels.bookings,
                method: 'POST',
                data: {
                    prebook_id: data.id,
                    contact: { ...contact, email: contact.email.trim(), phone: contact.phone.trim() },
                    rooms: effectiveRooms,
                    comment: comment.trim() || undefined,
                    payment_method: paymentMethod,
                    voucher_code: voucher?.code,
                },
            })
            if (paymentMethod === PAYMENT_METHODS.unified_payment_transfer && response.url) {
                window.location.href = response.url
                return
            }
            navigate(`/upload-payment/${response.attachment}`)
        } catch (error) {
            setSubmitError((error as Error).message)
            submitLock.current = false
            setSubmitting(false)
        }
    }

    const field = (key: string, label: string, input: React.ReactNode) => (
        <label className="block" data-error={Boolean(errors[key]) || undefined}>
            <span className="block text-sm font-medium text-zinc-700 mb-1">{label}</span>
            {input}
            {errors[key] && <span className="block text-xs text-red-600 mt-1">{errors[key]}</span>}
        </label>
    )
    const inputClass = (key: string) => `w-full h-11 px-3 rounded-lg border bg-white text-sm! outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`

    return (
        <div className="w-[95%] md:w-11/12 max-w-6xl mx-auto py-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Link to={backToHotel} className="text-sm text-blue-700 hover:underline">← Back to the hotel</Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mt-1">Complete your booking</h1>
                </div>
                {countdown && !expired && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                        <MdLock /> Price held for <span className="font-bold tabular-nums">{countdown.label}</span>
                    </div>
                )}
            </div>

            {expired && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex flex-wrap items-center justify-between gap-3">
                    <span>Your price hold has expired. Prices and availability may have changed.</span>
                    <Link to={backToHotel} className="inline-flex h-10 items-center px-4 rounded-lg bg-red-700 text-white font-semibold">Check rates again</Link>
                </div>
            )}

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
                <div className="space-y-4">
                    <section className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900">Lead guest</h2>
                            <p className="text-sm text-zinc-500">We'll send the confirmation and voucher to this email.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field('contact.first_name', 'First name', <input className={inputClass('contact.first_name')} value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} autoComplete="given-name" />)}
                            {field('contact.last_name', 'Last name', <input className={inputClass('contact.last_name')} value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} autoComplete="family-name" />)}
                            {field('contact.email', 'Email', <input type="email" className={inputClass('contact.email')} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" />)}
                            {field('contact.phone', 'Phone (with country code)', <input type="tel" className={inputClass('contact.phone')} value={contact.phone} placeholder="+234 801 234 5678" onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" />)}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                            <input type="checkbox" checked={leadIsGuest} onChange={(e) => setLeadIsGuest(e.target.checked)} className="size-4 accent-[var(--color-primary)]" />
                            I'm one of the guests staying at the hotel
                        </label>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900">Guest names</h2>
                            <p className="text-sm text-zinc-500">Enter names exactly as they appear on each passport. Children's names are optional.</p>
                        </div>
                        {rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="rounded-lg border border-slate-200 p-3 space-y-3">
                                <div className="font-semibold text-zinc-900">Room {roomIndex + 1} · {plural(room.adults.length, 'adult')}{room.children.length ? `, ${room.children.length === 1 ? '1 child' : `${room.children.length} children`}` : ''}</div>
                                {room.adults.map((guest, index) => {
                                    const isLead = roomIndex === 0 && index === 0 && leadIsGuest
                                    const key = `room.${roomIndex}.adult.${index}`
                                    return (
                                        <div key={key} data-error={Boolean(errors[key]) || undefined}>
                                            <div className="text-xs text-zinc-500 mb-1">Adult {index + 1}{isLead ? ' · lead guest' : ''}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input aria-label={`Room ${roomIndex + 1} adult ${index + 1} first name`} placeholder="First name" disabled={isLead} className={`${inputClass(key)} disabled:bg-slate-50 disabled:text-zinc-500`} value={isLead ? contact.first_name : guest.first_name} onChange={(e) => setGuest(roomIndex, 'adults', index, 'first_name', e.target.value)} />
                                                <input aria-label={`Room ${roomIndex + 1} adult ${index + 1} last name`} placeholder="Last name" disabled={isLead} className={`${inputClass(key)} disabled:bg-slate-50 disabled:text-zinc-500`} value={isLead ? contact.last_name : guest.last_name} onChange={(e) => setGuest(roomIndex, 'adults', index, 'last_name', e.target.value)} />
                                            </div>
                                            {errors[key] && <div className="text-xs text-red-600 mt-1">{errors[key]}</div>}
                                        </div>
                                    )
                                })}
                                {room.children.map((guest, index) => {
                                    const key = `room.${roomIndex}.child.${index}`
                                    const age = data.guests[roomIndex]?.children[index]
                                    return (
                                        <div key={key} data-error={Boolean(errors[key]) || undefined}>
                                            <div className="text-xs text-zinc-500 mb-1">Child {index + 1} · {age === 0 ? 'under 1' : plural(age ?? 0, 'year')} old (optional)</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input aria-label={`Room ${roomIndex + 1} child ${index + 1} first name`} placeholder="First name" className={inputClass(key)} value={guest.first_name} onChange={(e) => setGuest(roomIndex, 'children', index, 'first_name', e.target.value)} />
                                                <input aria-label={`Room ${roomIndex + 1} child ${index + 1} last name`} placeholder="Last name" className={inputClass(key)} value={guest.last_name} onChange={(e) => setGuest(roomIndex, 'children', index, 'last_name', e.target.value)} />
                                            </div>
                                            {errors[key] && <div className="text-xs text-red-600 mt-1">{errors[key]}</div>}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 space-y-2">
                        <h2 className="text-lg font-bold text-zinc-900">Special requests</h2>
                        <p className="text-sm text-zinc-500">The hotel will try to accommodate them, but they can't be guaranteed.</p>
                        <textarea maxLength={256} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. late arrival, quiet room" className="w-full p-3 rounded-lg border border-gray-300 text-sm! outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                        <div className="text-xs text-zinc-400 text-right">{comment.length}/256</div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 space-y-4" data-error={Boolean(errors.payment) || undefined}>
                        <VoucherInput service="HOTEL" amount={data.amount} currency={data.currency} value={voucher} onChange={setVoucher} />
                        <PaymentOptions sendData={setPaymentMethod} />
                        {errors.payment && <div className="text-xs text-red-600">{errors.payment}</div>}
                    </section>
                </div>

                <aside className="lg:sticky lg:top-20 space-y-3">
                    <div className="bg-white rounded-xl border border-slate-200/70 overflow-hidden">
                        <HotelImage image={hotel.data?.images?.[0]?.url} alt={data.hotel_name ?? ''} className="w-full h-40 object-cover" />
                        <div className="p-4 space-y-3 text-sm">
                            <div>
                                <StarRating stars={hotel.data?.star_rating ?? 0} className="size-3" />
                                <div className="text-lg font-bold text-zinc-900 leading-snug">{data.hotel_name}</div>
                                {hotel.data?.address && <div className="text-zinc-500">{hotel.data.address}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                                <div><div className="text-xs text-zinc-500">Check-in</div><div className="font-semibold">{dayjs(data.checkin).format('ddd, D MMM YYYY')}</div>{hotel.data?.check_in_time && <div className="text-xs text-zinc-500">from {hotel.data.check_in_time.slice(0, 5)}</div>}</div>
                                <div><div className="text-xs text-zinc-500">Check-out</div><div className="font-semibold">{dayjs(data.checkout).format('ddd, D MMM YYYY')}</div>{hotel.data?.check_out_time && <div className="text-xs text-zinc-500">until {hotel.data.check_out_time.slice(0, 5)}</div>}</div>
                            </div>
                            <div className="text-zinc-700">{plural(nights, 'night')} · {plural(data.guests.length, 'room')} · {plural(totalGuests, 'guest')}</div>
                            <div className="space-y-1.5">
                                <div className="flex items-start gap-2 font-semibold text-zinc-900"><MdBed className="shrink-0 mt-0.5 size-4" />{rate.room_name}</div>
                                <div className={`flex items-center gap-2 ${rate.meal.category !== 'no_meal' ? 'text-green-700' : 'text-zinc-700'}`}><MdRestaurant className="shrink-0 size-4" />{HotelMealLabels[rate.meal.category]?.label}</div>
                                <div className={`flex items-start gap-2 ${freeUntil ? 'text-green-700' : 'text-zinc-700'}`}>
                                    {freeUntil ? <MdEventAvailable className="shrink-0 mt-0.5 size-4" /> : <MdEventBusy className="shrink-0 mt-0.5 size-4" />}
                                    <span>{freeUntil ? `Free cancellation until ${dayjs(freeUntil).format('D MMM YYYY, h:mm A')}` : 'Non-refundable: a cancellation fee applies'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/70 p-4 text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-zinc-600">Room for {plural(nights, 'night')}</span><span className="tabular-nums">{formatMoney(data.amount, data.currency)}</span></div>
                        {voucher && <div className="flex justify-between text-green-700"><span>Voucher {voucher.code}</span><span className="tabular-nums">- {formatMoney(voucher.discount, voucher.currency)}</span></div>}
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>Total to pay now</span><span className="tabular-nums">{formatMoney(payable, data.currency)}</span></div>
                        {data.price_changed && <div className="text-xs text-amber-700">The price changed when we confirmed availability; this is the updated total.</div>}
                        {hotelTaxes.length > 0 && (
                            <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                                <div className="font-semibold mb-0.5">Payable at the hotel</div>
                                {hotelTaxes.map((tax, index) => <div key={index}>{humanizeSlug(tax.name)}: {formatMoney(tax.amount, tax.currency)}</div>)}
                            </div>
                        )}
                    </div>

                    {submitError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
                    <button type="submit" disabled={submitting || expired} className="w-full h-12 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                        {submitting && <ButtonSpinner />} {submitting ? 'Processing...' : `Book and pay ${formatMoney(payable, data.currency)}`}
                    </button>
                    <p className="text-xs text-zinc-500 text-center">Your room is confirmed with the hotel as soon as your payment is received. We'll email you the confirmation and voucher.</p>
                </aside>
            </form>
        </div>
    )
}
