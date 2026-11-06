import React from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import Skeleton from 'react-loading-skeleton'
import HotelImagesViews from '~/routes/general/hotel-page/partials/hotel-images-views'
import HotelSearchHeader from '~/routes/general/hotel-page/partials/hotel-search-header'
import Amenities from '~/routes/general/hotel-page/partials/amenities'
import ChangeCheckInOut from '~/routes/general/hotel-page/partials/change-check-in-out'
import AdditionalInformation from '~/routes/general/hotel-page/partials/additional-information'
import HotelDescription from '~/routes/general/hotel-page/partials/hotel-description'
import HotelRates from '~/routes/general/hotel-page/partials/hotel-rates'
import { Modal } from '@mantine/core'
import { modalStyle } from '~/components/utils'
import { useDisclosure } from '@mantine/hooks'
import Hotels from '~/routes/general/home/components/hotels'
import { FiX } from 'react-icons/fi'
import HotelTitleDisplay from '~/routes/general/hotel-page/partials/hotel-title-display'
import { createResponse, NewApis } from '~/services/new-apis'
import { readStay, stayPayload } from '~/routes/general/hotel-search/hotel-utils'
import HotelOverview from '~/routes/general/hotel-page/partials/hotel-overview'
import HotelSectionNav, { scrollToSection } from '~/routes/general/hotel-page/partials/hotel-section-nav'
import type { HotelFilterReference } from '~/routes/general/hotel-search/types'
import { useViewerCountry } from '~/routes/general/hotel-search/use-viewer-country'
import type { hotelProps, hotelRatesProps } from '~/routes/general/hotel-page/types'
import { seo } from '~/services/seo'

export function meta() {
    return seo({
        title: "Hotel Details & Room Rates",
        description: "See hotel photos, amenities and available room rates for your dates.",
        noindex: true,
    })
}

export default function index() {
    const [opened, { open, close }] = useDisclosure(false);
    const [searchParams] = useSearchParams();
    const hid = Number(searchParams.get('hid'));
    const stay = React.useMemo(() => readStay(searchParams), [searchParams]);
    const viewerCountry = useViewerCountry();

    // Static content comes from our database
    const { data: hotel, isLoading, isError, error } = useQuery<hotelProps>({
        queryKey: ['hotel-content', hid],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.single(hid) }),
        enabled: hid > 0,
        staleTime: 60 * 60 * 1000,
        retry: false,
    });

    // Live rates (ETG hotelpage) - only requested once a hotel and stay are chosen
    const rates = useQuery<hotelRatesProps>({
        queryKey: ['hotel-rates', hid, stay, viewerCountry],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.rates(hid), method: 'POST', data: stayPayload(stay!, viewerCountry) }),
        enabled: hid > 0 && stay !== null && Boolean(hotel),
        staleTime: 10 * 60 * 1000,
        retry: false,
    });

    const { data: reference } = useQuery<HotelFilterReference>({
        queryKey: ['hotel-filter-reference'],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.filters }),
        staleTime: 60 * 60 * 1000,
    });

    const showRooms = () => scrollToSection('hotel-rooms');

    if (!hid || isError) return (
        <div className="w-[95%] md:w-11/12 max-w-7xl mx-auto py-6">
            <div className="bg-white p-8 rounded-xl text-center text-sm">
                {(error as Error)?.message || 'This hotel could not be found.'}
            </div>
        </div>
    )

    if (isLoading || !hotel) return (
        <div className="w-[95%] md:w-11/12 max-w-7xl mx-auto py-4 space-y-3">
            <Skeleton height={44} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={440} borderRadius={12} />
            <Skeleton height={200} borderRadius={12} />
        </div>
    )

    return (
        <>

            <Modal
                opened={opened}
                onClose={close}
                withCloseButton={false}
                styles={modalStyle}
                size="lg"
                centered
            >
                <div className="p-3 md:p-4 lg:p-5">
                    <div className="mb-3 relative">
                        <div
                            onClick={close}
                            className="absolute top-0 right-0 cursor-pointer active:scale-95 transition-all text-3xl"> <FiX /> </div>
                        <div className="text-xl">{hotel.name}</div>
                        {stay && <div className="text-xl">for {dayjs(stay.checkin).format('D MMM')} – {dayjs(stay.checkout).format('D MMM YYYY')}</div>}
                    </div>
                    <Hotels
                        isHome={false}
                        close={close}
                        initialValues={{
                            ...(stay ?? {}),
                            destination: { type: 'hotel', id: hotel.hid, name: hotel.name, country_code: hotel.region?.country_code ?? null, region_name: hotel.region?.name ?? null },
                        }}
                    />
                </div>
            </Modal>
            <div className="w-[95%] md:w-11/12 max-w-7xl mx-auto py-4 space-y-3">
                <HotelSearchHeader open={open} hotel={hotel} stay={stay} />
                <HotelTitleDisplay
                    hotel={hotel}
                    rates={rates.data}
                    onShowRooms={showRooms}
                />
                <HotelImagesViews
                    images={hotel.images}
                    hotel={hotel}
                    onShowRooms={showRooms}
                />
                <HotelOverview hotel={hotel} reference={reference} onScrollTo={scrollToSection} />
                <HotelSectionNav />
                <ChangeCheckInOut
                    open={open}
                    hotel={hotel}
                    stay={stay}
                />
                <HotelRates
                    hotel={hotel}
                    stay={stay}
                    rates={rates}
                    reference={reference}
                    onChangeStay={open}
                />
                <HotelDescription
                    data={hotel.description_struct}
                    room={hotel}
                />
                <Amenities
                    data={hotel.amenity_groups}
                    popular={hotel.serp_filters}
                    reference={reference}
                />
                <AdditionalInformation
                    hotel={hotel}
                />
            </div>
        </>
    )
}
