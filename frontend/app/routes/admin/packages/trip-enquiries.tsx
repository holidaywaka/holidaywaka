

import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { TripEnquiryProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { ClientNaira, humanDateFormat, humanDateTimeFormat, modalStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import TripEnquiryModal from '~/components/admin/TripEnquiryModal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { tripEnquiryPropsRes } from '~/routes/admin/packages/types'


export function meta() {
    return [
        { title: `(0) Package Enquiries` },
        { name: "description", content: "Package Enquiries" }
    ];
}

const Headers = [
    "Trip Type",
    "Trip",
    `Amount (${ClientNaira})`,
    "Travel Date",
    "Status",
    "Payment Status",
    "Date Created",
]

export default function FlightBookings() {
    const [opened, { open, close }] = useDisclosure(false)
    const [single, setSingle] = useState<TripEnquiryProps>({})
    const [deleteText, setDeletetext] = useState({
        subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
        title: 'Cancel Flight Reservation',
        status: true,
        actionText: "Cancel Reservation"
    })
    const emptytext = {
        emptyTitle: "No Booking yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Flight Bookings match your search",
        icon: "/images/emptyflight.svg"
    }
    const { data, isLoading, refetch } = useFetchResponse<tripEnquiryPropsRes>({
        endpoint: NewApis.trips.all_enquiry,
        isSearch: true,
        header: "Package Enquiries"
    })

    function pageAction() {
        refetch()
    }

    function HandleNewAction() {
        open()
        setSingle({})
    }

    function HandleViewing(item: TripEnquiryProps) {
        open()
        setSingle(item)
        setDeletetext({
            ...deleteText, status: false
        })
    }


    return (
        <div>
            <Modal opened={opened} onClose={close} centered withCloseButton={false} styles={modalStyle}>
                <TripEnquiryModal
                    close={close}
                    title={single?.id ? "Service details" : ""}
                    isDelete={null}
                    data={single}
                    refetch={refetch}
                />
            </Modal>
            <AHeader
                title="Package Enquiries"
                subtitle="View and manage all Package enquiries"
            />
            <div className="w-[96%] mx-auto">
                <NavLinks options={["home", "package-enquiries"]}
                    header='Total Enquiries'
                    total={data?.total || 0}
                />
                <div className="">
                    <TableContainer
                        totalCount={data?.total ?? 0}
                        totalLength={data?.data?.length ?? 0}
                        pageAction={pageAction}
                        filters={['download', 'filter']}
                        searchTitle='Search by Origin or discount type'
                        empty={emptytext}
                        dateRange={true}
                        onClick={HandleNewAction}
                        options={Headers}
                        isLoading={isLoading}
                    >
                        {data?.data?.map((item, index) => (
                            <Tr
                                actions={['more']}
                                footer={index === data?.data?.length - 1 ? true : false}
                                key={index}
                                onView={() => HandleViewing(item)}
                                actionChildren={<>
                                    <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                                </>}
                            >
                                <Td> {item.tripType}</Td>
                                <Td> {item.Trip?.title}</Td>
                                <Td> {(item.Transactions?.amount)?.toLocaleString()}</Td>
                                <Td> {humanDateFormat(item.travelDate || '')} </Td>
                                <Td> <GetStatus status={item.status || ''} /> </Td>
                                <Td> <GetStatus status={item.Transactions?.paymentStatus || ''} /> </Td>
                                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
                            </Tr>
                        ))}
                    </TableContainer>
                </div>
            </div>
        </div >
    )
}
