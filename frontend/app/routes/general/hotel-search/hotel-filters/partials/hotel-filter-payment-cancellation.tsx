import FilterCheckList from '~/routes/general/hotel-search/hotel-filters/partials/filter-check-list';
import type { HotelSearchFilterCounts } from '~/routes/general/hotel-search/types';

type props = {
    counts?: HotelSearchFilterCounts;
    freeCancellation: boolean;
    paymentTypes: string[];
    onFreeCancellationChange: (value: boolean) => void;
    onPaymentTypesChange: (value: string[]) => void;
}

const FREE_CANCELLATION = 'free_cancellation';

export default function HotelFilterPaymentCancellation(props: props) {
    const payAtHotel = props.counts?.payment_types?.hotel ?? 0;
    return (
        <FilterCheckList
            title="Booking conditions"
            options={[
                { value: FREE_CANCELLATION, label: 'Free cancellation available', count: props.counts?.free_cancellation ?? 0 },
                // "deposit" and "now" are both paid online at checkout; only "hotel" differs for the guest
                ...(payAtHotel > 0 || props.paymentTypes.includes('hotel') ? [{ value: 'hotel', label: 'Pay at the hotel', count: payAtHotel }] : []),
            ]}
            selected={[...(props.freeCancellation ? [FREE_CANCELLATION] : []), ...props.paymentTypes]}
            onChange={(selected) => {
                props.onFreeCancellationChange(selected.includes(FREE_CANCELLATION));
                props.onPaymentTypesChange(selected.filter((item) => item !== FREE_CANCELLATION));
            }}
        />
    )
}
