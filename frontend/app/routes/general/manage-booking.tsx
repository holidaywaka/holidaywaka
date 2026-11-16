import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { FiAlertCircle, FiCheckCircle, FiMail, FiSearch, FiSend } from 'react-icons/fi'
import { createResponse, NewApis } from '~/services/new-apis'
import type { hotelBookingProps } from '~/routes/general/hotel-page/types'
import HotelBookingDetails from '~/routes/general/hotel-booking/booking-details'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage('Manage Your Booking')
}

const ISSUES = [
    'The hotel has no record of my booking',
    'Problem at check-in',
    'Room is different from what I booked',
    'I want to change or cancel my booking',
    'Payment or refund question',
    'Something else',
]

const field = 'w-full h-12 px-4 rounded-lg border border-slate-300 bg-white text-base! outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition'

export default function ManageBookingPage() {
    const [searchParams] = useSearchParams()
    const [reference, setReference] = React.useState(searchParams.get('reference') ?? '')
    const [email, setEmail] = React.useState('')
    // The lookup that succeeded: complaints are sent with exactly these credentials
    const [found, setFound] = React.useState<{ booking: hotelBookingProps; reference: string; email: string } | null>(null)

    const lookup = useMutation({
        mutationFn: (values: { reference: string; email: string }) => createResponse({ endpoint: NewApis.hotels.track_booking, method: 'POST', data: values }) as Promise<hotelBookingProps>,
        onSuccess: (booking, values) => setFound({ booking, ...values }),
    })

    function submit(event: React.FormEvent) {
        event.preventDefault()
        setFound(null)
        lookup.mutate({ reference: reference.trim(), email: email.trim() })
    }

    return (
        <div className="bg-champagne min-h-[70dvh]">
            <div className="w-11/12 max-w-4xl mx-auto py-10 md:py-16 space-y-8">
                <header className="text-center max-w-2xl mx-auto">
                    <div className="text-xs font-bold uppercase tracking-[0.28em] text-rose-deep">Manage booking</div>
                    <h1 className="font-display font-semibold text-primary text-4xl md:text-5xl leading-tight mt-3">Find your reservation</h1>
                    <p className="text-zinc-600 mt-3">Enter the booking reference from your confirmation email (it starts with <span className="font-semibold">HW-</span>) and the email address you booked with.</p>
                </header>

                <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/70 p-4 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_1.3fr_auto] gap-3 items-end">
                    <label className="block">
                        <span className="block text-sm font-medium text-zinc-700 mb-1.5">Booking reference</span>
                        <input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder="HW-AB12CD34" autoComplete="off" className={`${field} uppercase tracking-wide`} />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-medium text-zinc-700 mb-1.5">Email address</span>
                        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className={field} />
                    </label>
                    <button type="submit" disabled={lookup.isPending} className="h-12 px-6 rounded-lg bg-primary text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition hover:bg-primary/90">
                        <FiSearch /> {lookup.isPending ? 'Searching…' : 'Find booking'}
                    </button>
                    {lookup.isError && (
                        <div role="alert" className="md:col-span-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                            <FiAlertCircle className="shrink-0 mt-0.5" /> {(lookup.error as Error).message}
                        </div>
                    )}
                </form>

                {found && (
                    <>
                        <HotelBookingDetails data={found.booking} headingLevel="h2" />
                        <ComplaintForm reference={found.reference} email={found.email} bookingReference={found.booking.reference} />
                    </>
                )}
            </div>
        </div>
    )
}

function ComplaintForm({ reference, email, bookingReference }: { reference: string; email: string; bookingReference: string }) {
    const [subject, setSubject] = React.useState(ISSUES[0])
    const [message, setMessage] = React.useState('')

    const send = useMutation({
        mutationFn: () => createResponse({ endpoint: NewApis.hotels.booking_complaint, method: 'POST', data: { reference, email, subject, message: message.trim() } }) as Promise<{ message: string; data: { holidaywaka: boolean; ratehawk: boolean | null } }>,
    })

    if (send.isSuccess) return (
        <section className="bg-white rounded-2xl border border-green-200 p-5 md:p-6 flex items-start gap-3" aria-live="polite">
            <FiCheckCircle className="shrink-0 size-6 text-green-700 mt-0.5" />
            <div>
                <h2 className="font-bold text-zinc-900">Message sent</h2>
                <p className="text-sm text-zinc-600 mt-1">{send.data.message}</p>
                <p className="text-sm text-zinc-600 mt-1">Replies will come to <span className="font-semibold">{email}</span>. Keep your reference <span className="font-semibold">{bookingReference}</span> handy.</p>
            </div>
        </section>
    )

    return (
        <section className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-3">
                <div className="size-10 shrink-0 rounded-full bg-blush text-rose-deep flex items-center justify-center"><FiMail /></div>
                <div>
                    <h2 className="font-bold text-zinc-900 text-lg">Having a problem with this booking?</h2>
                    <p className="text-sm text-zinc-600">Tell us what's wrong. Your message goes to the Holidaywaka team and, for bookings confirmed with the hotel, directly to our hotel partner RateHawk, with your booking details attached.</p>
                </div>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); send.mutate() }} className="space-y-3">
                <fieldset>
                    <legend className="block text-sm font-medium text-zinc-700 mb-2">What is it about?</legend>
                    <div className="flex flex-wrap gap-2">
                        {ISSUES.map((issue) => (
                            <button key={issue} type="button" aria-pressed={subject === issue} onClick={() => setSubject(issue)}
                                className={`px-3 py-2 rounded-full border text-sm cursor-pointer transition ${subject === issue ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-700 border-slate-300 hover:border-primary/50'}`}>
                                {issue}
                            </button>
                        ))}
                    </div>
                </fieldset>
                <label className="block">
                    <span className="block text-sm font-medium text-zinc-700 mb-1.5">Your message</span>
                    <textarea required minLength={10} maxLength={3000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)}
                        placeholder="Describe what happened, e.g. where you are now and what the hotel told you."
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-base! outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition" />
                    <span className="block text-xs text-zinc-500 text-right">{message.trim().length}/3000</span>
                </label>
                {send.isError && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                        <FiAlertCircle className="shrink-0 mt-0.5" /> {(send.error as Error).message}
                    </div>
                )}
                <button type="submit" disabled={send.isPending || message.trim().length < 10} className="h-12 px-6 rounded-lg bg-primary text-white font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 transition hover:bg-primary/90">
                    <FiSend /> {send.isPending ? 'Sending…' : 'Send message'}
                </button>
            </form>
        </section>
    )
}
