import React from 'react'
import dayjs from 'dayjs'
import { Drawer } from '@mantine/core'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import Skeleton from 'react-loading-skeleton'
import { FiSearch } from 'react-icons/fi'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import { drawerStyle } from '~/components/utils'
import { getAlert } from '~/services/get-alert'
import { createResponse, downloadFile, NewApis } from '~/services/new-apis'
import { formatMoney, plural } from '~/routes/general/hotel-search/hotel-utils'
import type { hotelAdminBookingProps, hotelAdminBookingsResponse, hotelBookingStatus } from '~/routes/general/hotel-page/types'

export function meta() {
    return [{ title: 'Hotel bookings' }]
}

export const BookingStatusMeta: Record<hotelBookingStatus, { label: string; className: string }> = {
    awaiting_payment: { label: 'Awaiting payment', className: 'bg-amber-50 text-amber-800 border-amber-200' },
    payment_declined: { label: 'Payment declined', className: 'bg-red-50 text-red-700 border-red-200' },
    booking: { label: 'Booking…', className: 'bg-blue-50 text-blue-800 border-blue-200' },
    confirmed: { label: 'Confirmed', className: 'bg-green-50 text-green-800 border-green-200' },
    failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
    needs_attention: { label: 'Needs attention', className: 'bg-orange-50 text-orange-800 border-orange-300' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-zinc-700 border-slate-200' },
}

const TABS: (hotelBookingStatus | '')[] = ['', 'needs_attention', 'failed', 'awaiting_payment', 'booking', 'confirmed', 'cancelled', 'payment_declined']

export function BookingStatusBadge({ status }: { status: hotelBookingStatus }) {
    const meta = BookingStatusMeta[status]
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${meta?.className ?? ''}`}>{meta?.label ?? status}</span>
}

export default function HotelBookings() {
    const [searchParams, setSearchParams] = useSearchParams()
    const status = searchParams.get('status') ?? ''
    const page = Number(searchParams.get('page') || 1)
    const [search, setSearch] = React.useState(searchParams.get('search') ?? '')
    const [selectedId, setSelectedId] = React.useState<string | null>(null)

    const params = new URLSearchParams({ page: String(page), page_size: '20', ...(status ? { status } : {}), ...(searchParams.get('search') ? { search: searchParams.get('search')! } : {}) })
    const { data, isLoading, isFetching, isError, error, refetch } = useQuery<hotelAdminBookingsResponse>({
        queryKey: ['admin-hotel-bookings', params.toString()],
        queryFn: () => createResponse({ endpoint: `${NewApis.hotels.admin_bookings}?${params}` }),
        placeholderData: keepPreviousData,
        refetchInterval: 30_000,
    })

    function update(next: Record<string, string>) {
        const params = new URLSearchParams(searchParams)
        Object.entries(next).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
        setSearchParams(params)
    }

    const totalAll = Object.values(data?.status_counts ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)

    return (
        <div>
            <Drawer opened={Boolean(selectedId)} onClose={() => setSelectedId(null)} title="Hotel booking" styles={drawerStyle} position="right" size="xl">
                {selectedId && <BookingDetail id={selectedId} />}
            </Drawer>
            <AHeader title="Hotel bookings" subtitle="Payments, supplier confirmations, cancellations and vouchers" />
            <div className="w-[96%] mx-auto space-y-3 pb-10">
                <NavLinks options={["home", "hotel-bookings"]} header="Total bookings" total={totalAll} />

                <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1">
                        {TABS.map((tab) => {
                            const count = tab ? data?.status_counts?.[tab] ?? 0 : totalAll
                            const active = status === tab
                            return (
                                <button key={tab || 'all'} type="button" onClick={() => update({ status: tab, page: '' })}
                                    className={`h-9 px-3 rounded-md text-sm font-medium cursor-pointer transition-colors ${active ? 'bg-primary text-white' : 'text-zinc-700 hover:bg-slate-100'}`}>
                                    {tab ? BookingStatusMeta[tab].label : 'All'} <span className={`ml-1 text-xs ${active ? 'text-white/80' : 'text-zinc-400'}`}>{count}</span>
                                </button>
                            )
                        })}
                    </div>
                    <form onSubmit={(event) => { event.preventDefault(); update({ search: search.trim(), page: '' }) }} className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-300 w-full sm:w-72">
                        <FiSearch className="text-zinc-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, hotel, guest or email" className="w-full text-sm! outline-none bg-transparent" />
                    </form>
                </div>

                {/* A failed request must not look like "no bookings" */}
                {isError && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <span>Couldn't load hotel bookings: {(error as Error)?.message || 'the server did not respond'}.{data ? ' Showing the last loaded list.' : ''}</span>
                        <button type="button" onClick={() => refetch()} disabled={isFetching} className="h-9 px-3 rounded-md border border-red-300 bg-white font-medium text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                            {isFetching ? 'Retrying...' : 'Try again'}
                        </button>
                    </div>
                )}

                <div className={`bg-white rounded-lg border border-slate-200 overflow-x-auto ${isFetching ? 'opacity-70' : ''}`}>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                            <tr>
                                <th className="p-3">Reference</th>
                                <th className="p-3">Hotel</th>
                                <th className="p-3">Lead guest</th>
                                <th className="p-3">Stay</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3">Payment</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && Array.from({ length: 6 }).map((_, index) => <tr key={index}><td colSpan={8} className="p-3"><Skeleton height={20} /></td></tr>)}
                            {!isLoading && isError && !data && <tr><td colSpan={8} className="p-10 text-center text-red-600">Bookings could not be loaded. Use "Try again" above.</td></tr>}
                            {!isLoading && data?.data.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-zinc-500">No hotel bookings{status ? ` with status "${BookingStatusMeta[status as hotelBookingStatus]?.label}"` : ''} yet.</td></tr>}
                            {data?.data.map((booking) => (
                                <tr key={booking.id} onClick={() => setSelectedId(booking.id)} className="cursor-pointer hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-zinc-900 whitespace-nowrap">{booking.reference}</td>
                                    <td className="p-3 max-w-56"><div className="truncate">{booking.hotel_name}</div><div className="text-xs text-zinc-500 truncate">{booking.room_name}</div></td>
                                    <td className="p-3"><div>{booking.contact.first_name} {booking.contact.last_name}</div><div className="text-xs text-zinc-500">{booking.contact.email}</div></td>
                                    <td className="p-3 whitespace-nowrap">{dayjs(booking.checkin).format('D MMM')} – {dayjs(booking.checkout).format('D MMM YYYY')}<div className="text-xs text-zinc-500">{plural(booking.nights, 'night')}</div></td>
                                    <td className="p-3 text-right tabular-nums whitespace-nowrap">{formatMoney(booking.amount, booking.currency)}</td>
                                    <td className="p-3 whitespace-nowrap"><div>{booking.payment?.status ?? '-'}</div><div className="text-xs text-zinc-500">{booking.payment?.type === 'UNIFIED_PAYMENT_TRANSFER' ? 'Unified Payment' : 'Bank transfer'}{booking.payment?.has_proof ? ' · slip uploaded' : ''}</div></td>
                                    <td className="p-3"><BookingStatusBadge status={booking.status} /></td>
                                    <td className="p-3 whitespace-nowrap text-zinc-500">{dayjs(booking.created_at).format('D MMM, HH:mm')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data && data.total_pages > 1 && (
                    <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-zinc-500">Page {data.page} of {data.total_pages}</span>
                        <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="h-9 px-3 rounded-md border border-slate-300 bg-white disabled:opacity-40 cursor-pointer">Back</button>
                        <button type="button" disabled={page >= data.total_pages} onClick={() => update({ page: String(page + 1) })} className="h-9 px-3 rounded-md border border-slate-300 bg-white disabled:opacity-40 cursor-pointer">Next</button>
                    </div>
                )}
            </div>
        </div>
    )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0">
            <span className="text-zinc-500 shrink-0">{label}</span>
            <span className="text-right font-medium text-zinc-900 break-all">{children ?? '-'}</span>
        </div>
    )
}

function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                {actions}
            </div>
            {children}
        </section>
    )
}

function BookingDetail({ id }: { id: string }) {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery<hotelAdminBookingProps>({
        queryKey: ['admin-hotel-booking', id],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.admin_booking(id) }),
        refetchInterval: (query) => (query.state.data?.status === 'booking' ? 4000 : false),
    })
    const [cancelReason, setCancelReason] = React.useState('')
    const [confirmCancel, setConfirmCancel] = React.useState(false)
    const [declineReason, setDeclineReason] = React.useState('')

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-hotel-booking', id] })
        queryClient.invalidateQueries({ queryKey: ['admin-hotel-bookings'] })
    }
    const action = useMutation({
        mutationFn: ({ endpoint, method = 'POST', body }: { endpoint: string; method?: 'POST' | 'PUT'; body?: unknown }) => createResponse({ endpoint, method, data: body ?? {} }),
        onSuccess: (response) => { getAlert(response?.message ?? 'Done', 'success'); refresh(); setConfirmCancel(false) },
        onError: (error) => getAlert((error as Error).message, 'error'),
    })

    if (isLoading || !data) return <div className="p-4 space-y-2"><Skeleton height={120} /><Skeleton height={240} /></div>

    const transaction = data.transaction
    const busy = action.isPending
    const markPayment = (status: 'PAID' | 'Declined') => transaction && action.mutate({
        endpoint: NewApis.transactions.payment_status(transaction.id),
        method: 'PUT',
        body: { status, reason: status === 'Declined' ? declineReason || undefined : undefined },
    })
    const button = 'h-9 px-3 rounded-md text-sm font-semibold cursor-pointer disabled:opacity-50'

    return (
        <div className="p-4 space-y-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <div className="text-xs text-zinc-500">{data.reference}</div>
                    <div className="text-lg font-bold text-zinc-900">{data.hotel_name}</div>
                    <div className="text-zinc-500">{[data.hotel_address, data.region_name].filter(Boolean).join(', ')}</div>
                </div>
                <BookingStatusBadge status={data.status} />
            </div>
            {data.failure_reason && <div className="rounded-md border border-orange-200 bg-orange-50 p-2 text-orange-900">{data.failure_reason}</div>}

            <Card title="Payment">
                <Row label="Customer paid">{formatMoney(data.amount, data.currency)}{data.discount > 0 ? ` (voucher ${data.voucher_code}: -${formatMoney(data.discount, data.currency)})` : ''}</Row>
                <Row label="Method">{transaction?.payment_type === 'UNIFIED_PAYMENT_TRANSFER' ? 'Unified Payment checkout' : 'Bank transfer'}</Row>
                <Row label="Status">{transaction?.payment_status}</Row>
                <Row label="Reference">{transaction?.txid}</Row>
                {transaction?.decline_reason && <Row label="Decline reason">{transaction.decline_reason}</Row>}
                {transaction && !['PAID', 'Declined'].includes(transaction.payment_status) && (
                    <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-2">
                        <div className="text-xs text-zinc-600">Confirm the bank transfer to start the booking with the hotel, or decline it.</div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={busy} onClick={() => markPayment('PAID')} className={`${button} bg-primary text-white`}>Mark as paid & book</button>
                            <input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Decline reason (emailed to the guest)" className="h-9 flex-1 min-w-40 px-2 rounded-md border border-slate-300 text-sm! outline-none" />
                            <button type="button" disabled={busy} onClick={() => markPayment('Declined')} className={`${button} border border-red-300 text-red-700`}>Decline</button>
                        </div>
                    </div>
                )}
            </Card>

            <Card title="Stay">
                <Row label="Dates">{dayjs(data.checkin).format('ddd D MMM YYYY')} – {dayjs(data.checkout).format('ddd D MMM YYYY')} ({plural(data.nights, 'night')})</Row>
                <Row label="Room">{data.room_name}</Row>
                <Row label="Meals">{data.meal}</Row>
                <Row label="Free cancellation">{data.free_cancellation_before ? dayjs(data.free_cancellation_before).format('D MMM YYYY, HH:mm') : 'Non-refundable'}</Row>
                <Row label="Residency">{data.residency?.toUpperCase()}</Row>
                {data.rooms.map((room, index) => (
                    <Row key={index} label={`Room ${index + 1}`}>{room.guests.map((guest) => `${guest.first_name} ${guest.last_name}${guest.is_child ? ` (${guest.age})` : ''}`).join(', ')}</Row>
                ))}
                <Row label="Contact">{data.contact.first_name} {data.contact.last_name} · {data.contact.email} · {data.contact.phone}</Row>
                {data.comment && <Row label="Request">{data.comment}</Row>}
            </Card>

            <Card title="Supplier (RateHawk)" actions={data.partner_order_id && (
                <button type="button" disabled={busy} onClick={() => action.mutate({ endpoint: NewApis.hotels.admin_refresh(id) })} className={`${button} border border-slate-300`}>Refresh</button>
            )}>
                <Row label="ETG order id">{data.etg_order_id}</Row>
                <Row label="Partner order id">{data.partner_order_id}</Row>
                <Row label="Last ETG status">{data.etg_status}</Row>
                <Row label="Hotel confirmation no.">{data.hotel_confirmation_number ?? 'Pending'}</Row>
                <Row label="Supplier price">{data.contract_amount !== null ? formatMoney(data.contract_amount, data.contract_currency ?? 'USD') : formatMoney(data.net_amount, data.net_currency)}</Row>
                <Row label="Markup / VAT">{data.markup ? `${data.markup.value}${data.markup.type === 'FIXED' ? ' USD' : '%'} / ${data.markup.vat}%` : 'None'}</Row>
                {data.order_info?.status && <Row label="ETG order status">{String(data.order_info.status)}</Row>}
                {data.cancellation && <>
                    <Row label="Cancellation fee (supplier)">{formatMoney(data.cancellation.penalty, data.cancellation.currency)}</Row>
                    <Row label="Refunded by supplier">{formatMoney(data.cancellation.refund, data.cancellation.currency)}</Row>
                </>}
            </Card>

            <div className="flex flex-wrap gap-2">
                {data.has_voucher && (
                    <button type="button" onClick={() => downloadFile(NewApis.hotels.admin_voucher(id), `voucher-${data.reference}.pdf`).catch((error) => getAlert(error.message, 'error'))} className={`${button} border border-slate-300`}>Download voucher</button>
                )}
                {['needs_attention', 'failed'].includes(data.status) && transaction?.payment_status === 'PAID' && (
                    <button type="button" disabled={busy} onClick={() => action.mutate({ endpoint: NewApis.hotels.admin_retry(id) })} className={`${button} bg-primary text-white`}>{busy ? 'Booking…' : 'Retry booking'}</button>
                )}
                {data.status === 'confirmed' && !confirmCancel && (
                    <button type="button" onClick={() => setConfirmCancel(true)} className={`${button} border border-red-300 text-red-700`}>Cancel with hotel</button>
                )}
            </div>
            {confirmCancel && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="text-red-900">
                        {data.free_cancellation_before && dayjs(data.free_cancellation_before).isAfter(dayjs())
                            ? `Free cancellation applies until ${dayjs(data.free_cancellation_before).format('D MMM YYYY, HH:mm')}.`
                            : 'This booking is outside free cancellation: the supplier will charge a cancellation fee.'} The guest is emailed once cancelled; refund them manually.
                    </div>
                    <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason (internal)" className="h-9 w-full px-2 rounded-md border border-slate-300 text-sm! outline-none bg-white" />
                    <div className="flex gap-2">
                        <button type="button" disabled={busy} onClick={() => action.mutate({ endpoint: NewApis.hotels.admin_cancel(id), body: { reason: cancelReason || undefined } })} className={`${button} bg-red-700 text-white`}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
                        <button type="button" onClick={() => setConfirmCancel(false)} className={`${button} border border-slate-300`}>Keep booking</button>
                    </div>
                </div>
            )}

            <Card title="Timeline">
                <ol className="space-y-1.5">
                    {[...(data.events ?? [])].reverse().map((event, index) => (
                        <li key={index} className="flex gap-3">
                            <span className="shrink-0 w-28 text-xs text-zinc-500">{dayjs(event.at).format('D MMM HH:mm:ss')}</span>
                            <span className="min-w-0">
                                <span className="font-medium text-zinc-900">{event.event.replace(/_/g, ' ')}</span>
                                {event.detail && <span className="block text-xs text-zinc-500 break-all">{JSON.stringify(event.detail)}</span>}
                            </span>
                        </li>
                    ))}
                </ol>
            </Card>
        </div>
    )
}
