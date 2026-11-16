import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import Skeleton from 'react-loading-skeleton'
import { createResponse, NewApis } from '~/services/new-apis'
import type { hotelBookingProps } from '~/routes/general/hotel-page/types'
import HotelBookingDetails, { PENDING_STATUSES } from '~/routes/general/hotel-booking/booking-details'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage('Your Hotel Booking')
}

export default function HotelBookingPage() {
    const { id = '' } = useParams()

    const { data, isLoading, isError, error } = useQuery<hotelBookingProps>({
        queryKey: ['hotel-booking', id],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.single_booking(id) }),
        enabled: Boolean(id),
        // Follow the booking while payment or the hotel confirmation is in progress
        refetchInterval: (query) => (query.state.data && PENDING_STATUSES.includes(query.state.data.status) ? 5000 : false),
        retry: false,
    })

    if (isLoading) return <div className="w-[95%] max-w-4xl mx-auto py-8 space-y-3"><Skeleton height={120} borderRadius={12} /><Skeleton height={360} borderRadius={12} /></div>
    if (isError || !data) return (
        <div className="w-[95%] max-w-xl mx-auto py-16 text-center space-y-3">
            <div className="text-xl font-bold">Booking not found</div>
            <div className="text-zinc-600">{(error as Error)?.message}</div>
            <Link to="/hotels" className="inline-flex h-11 items-center px-5 rounded-lg bg-primary text-white font-semibold">Search hotels</Link>
        </div>
    )

    return (
        <div className="w-[95%] max-w-4xl mx-auto py-6 space-y-4">
            <HotelBookingDetails data={data} />
            <div className="text-sm text-zinc-600 text-center">
                Problem with this booking? <Link to={`/manage-booking?reference=${encodeURIComponent(data.reference)}`} className="font-semibold text-primary underline underline-offset-2">Contact us about it</Link>
            </div>
        </div>
    )
}
