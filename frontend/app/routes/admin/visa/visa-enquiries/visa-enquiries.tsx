

import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { visaEnquiryProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateFormat, humanDateTimeFormat, modalStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { visaEnquiryPropsRes } from '~/routes/admin/visa/types'
import VisaEnquiryModal from '~/routes/admin/visa/visa-enquiries/visa-enquiries-modal'


export function meta() {
    return [
        { title: `(0) Visa Enquiries` },
        { name: "description", content: "Visa Enquiries" }
    ];
}

const Headers = [
    "Full Name",
    `Nationality`,
    `Visa Type`,
    `Visa Country`,
    `Payment For`,
    "Travel Date",
    "Has Passport",
    "Visa Status",
    "Date Created",
]

export default function FlightBookings() {
    const [opened, { open, close }] = useDisclosure(false)
    const [single, setSingle] = useState<visaEnquiryProps>({})
    const [deleteText, setDeletetext] = useState({
        subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
        title: 'Cancel Flight Reservation',
        status: true,
        actionText: "Cancel Reservation"
    })
    const emptytext = {
        emptyTitle: "No Enquiry yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Flight Bookings match your search",
        icon: "/images/emptyflight.svg"
    }

    const { data, isLoading, refetch } = useFetchResponse<visaEnquiryPropsRes>({
        endpoint: NewApis.visa.all_enquiries,
        isSearch: true,
        header: "Visa Enquiries"
    })

    function pageAction() {
        refetch()
    }

    function HandleNewAction() {
        open()
        setSingle({})
    }

    function HandleViewing(item: visaEnquiryProps) {
        open()
        setSingle(item)
        setDeletetext({
            ...deleteText, status: false
        })
    }


    return (
        <div>
            <Modal opened={opened} onClose={close} centered withCloseButton={false} styles={modalStyle}>
                <VisaEnquiryModal
                    close={close}
                    title={single?.id ? "Enquiry details" : ""}
                    isDelete={null}
                    data={single}
                    readOnly={false}
                    refetch={refetch}
                />
            </Modal>
            <AHeader
                title="Visa Enquriries"
                subtitle="View and manage all Visa enquiries"
            />
            <div className="w-[96%] mx-auto">
                <NavLinks options={["home", "visa-enquiries"]}
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
                                <Td> {item.firstName} {item.lastName}</Td>
                                <Td> {item.nationality}</Td>
                                <Td> {item.visa?.visaType}</Td>
                                <Td> {item.visa?.country}</Td>
                                <Td> {item.visa?.paymentType}</Td>
                                <Td> {humanDateFormat(item.travelDate || '')} </Td>
                                <Td> {item.hasPassport?.toUpperCase()}</Td>
                                <Td> <GetStatus status={item.status || ''} /> </Td>
                                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
                            </Tr>
                        ))}
                    </TableContainer>
                </div>
            </div>
        </div >
    )
}
