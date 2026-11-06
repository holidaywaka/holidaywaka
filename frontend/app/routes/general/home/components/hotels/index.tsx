import { useForm } from '@mantine/form';
import { ArrowDown2 } from 'iconsax-reactjs';
import React from 'react'
import { FiSearch } from 'react-icons/fi'
import { useNavigate } from 'react-router';
import Formbutton from '~/components/general/Formbutton'
import { useIsNavigating } from '~/components/general/NavigationProgress';
import CheckInAndOut from '~/routes/general/home/components/hotels/partials/check-in-and-out';
import HotelDestination from '~/routes/general/home/components/hotels/partials/hotel-destination';
import HotelGuestSelector from '~/routes/general/home/components/hotels/partials/hotel-guests-selector';
import HotelMealsView from '~/routes/general/home/components/hotels/partials/hotel-meal-view';
import HotelNationality from '~/routes/general/home/components/hotels/partials/hotel-nationality';
import HotelStarsView from '~/routes/general/home/components/hotels/partials/hotel-star-view';
import { defaultStay, hotelPageLink, hotelSearchLink, validateStayDates } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelDestination as HotelDestinationValue, HotelGuestRoom } from '~/routes/general/hotel-search/types';

export type HotelSearchFormValues = {
    destination: HotelDestinationValue | null;
    checkin: string | null;
    checkout: string | null;
    residency: string;
    guests: HotelGuestRoom[];
    stars: number[];
    meals: string[];
}

type props = {
    isHome: boolean;
    close?: () => void;
    /** Prefills the form when searching again from the results or hotel page */
    initialValues?: Partial<HotelSearchFormValues>;
}
export default function Hotels(props: props) {
    const [drops, setDrops] = React.useState(false);
    const navigate = useNavigate();
    const isNavigating = useIsNavigating();

    const form = useForm<HotelSearchFormValues>({
        mode: "controlled",
        initialValues: {
            destination: null,
            ...defaultStay(),
            // No preselected dates: the visitor picks them, the fields show "Select date"
            checkin: null,
            checkout: null,
            stars: [],
            meals: [],
            ...props.initialValues,
        },
        validate: {
            destination: (value) => value ? null : "Select a destination or hotel",
            checkin: (value, values) => validateStayDates(value, values.checkout),
        }
    })

    function HandeSubmission(values: HotelSearchFormValues) {
        const stay = {
            checkin: values.checkin!,
            checkout: values.checkout!,
            residency: values.residency,
            guests: values.guests,
        };
        const destination = values.destination!;
        navigate(destination.type === "hotel"
            ? hotelPageLink(destination.id, stay)
            : hotelSearchLink(destination.id, stay, { stars: values.stars, meals: values.meals }));
        props.close?.();
    }
    return (
        <form onSubmit={form.onSubmit(HandeSubmission)}>
            <div className={`${props.isHome ? 'pb-12' : 'h-fit max-h-100 overflow-y-auto pb-10'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-9 pt-2 gap-1">
                    <div className={`${props.isHome ? 'lg:col-span-4' : 'lg:col-span-9'}`}>
                        <HotelDestination
                            value={form.values.destination}
                            onChange={(value) => form.setFieldValue('destination', value)}
                            error={form.errors.destination}
                        />
                    </div>
                    <div className={`${props.isHome ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-1">
                            <CheckInAndOut
                                form={form}
                            />
                            <div className="md:col-span-2">
                                <HotelGuestSelector
                                    form={form as any}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => setDrops(o => !o)}
                    className="flex items-center gap-1 mt-5 mb-2 p-2 cursor-pointer active:scale-95 transition-all hover:bg-zinc-100 size-fit rounded-md">
                    <div className="">Additional search request</div>
                    <div
                        className=""><ArrowDown2 className={`${drops ? 'rotate-180' : 'rotate-0'} transition-all`} /></div>
                </div>


                <div className={`${drops ? 'block' : 'hidden'}`}>
                    <div className={`grid grid-cols-1 ${props.isHome ? 'md:grid-cols-7' : ''} gap-3`}>
                        <div className="space-y-4 md:col-span-3">
                            <HotelNationality
                                value={form.values.residency}
                                onChange={(value) => form.setFieldValue('residency', value)}
                            />
                            <HotelStarsView
                                value={form.values.stars}
                                onChange={(value) => form.setFieldValue('stars', value)}
                            />
                        </div>
                        <div className="md:col-span-4">
                            <HotelMealsView
                                value={form.values.meals}
                                onChange={(value) => form.setFieldValue('meals', value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${props.isHome ? 'w-full max-w-60 mx-auto absolute -bottom-5 left-0 right-0' : ''}`}>
                <Formbutton loading={form.submitting || isNavigating} title="SEARCH" Icon={FiSearch} bg="!py-4 bg-primary text-white" />
            </div>
        </form>
    )
}
