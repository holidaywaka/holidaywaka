
import { Drawer, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { markupProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { displayDiscount, humanDateTimeFormat, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import MarkupModal from '~/routes/admin/markup/markup-modal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { markupPropsRes } from '~/routes/admin/markup/types'


export function meta() {
    return [
        { title: `(0) Markups` },
        { name: "description", content: "Markups" }
    ];
}

const Headers = [
    "Tag",
    "Markup",
    "VAT",
    "status",
    "Date Created",
]

export default function FlightBookings() {
    const [opened, { open, close }] = useDisclosure(false)
    const [single, setSingle] = useState<markupProps>({})
    const [deleteText, setDeletetext] = useState({
        subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
        title: 'Cancel Flight Reservation',
        status: true,
        actionText: "Cancel Reservation"
    })
    const emptytext = {
        emptyTitle: "No Markup yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Markup match your search",
        icon: "/images/emptyflight.svg"
    }

    const { data, isLoading, refetch } = useFetchResponse<markupPropsRes>({
        endpoint: NewApis.markups.markups,
        isSearch: true,
        header: "Markups"
    })

    function pageAction() {
        refetch()
    }

    function HandleNewAction() {
        open()
        setSingle({})
    }

    function HandleViewing(item: markupProps) {
        open()
        setSingle(item)
        setDeletetext({
            ...deleteText, status: false
        })
    }


    return (
        <div>
            <Drawer opened={opened} onClose={close} position='right' withCloseButton={false} styles={drawerStyle}>
                <MarkupModal
                    close={close}
                    title={single?.id ? "Markup details" : "Manage Markup"}
                    services={data?.services ?? []}
                    isDelete={null}
                    data={single}
                    readOnly={false}
                    refetch={refetch}
                />
            </Drawer>
            <AHeader
                title="Markup"
                subtitle="View and manage all markups"
            />
            <div className="w-[96%] mx-auto">
                <NavLinks
                    options={["home", "markup"]}
                    title="Add Markup"
                    onClick={HandleNewAction}
                    header="Total Markup"
                    total={data?.total || 0}
                />
                <div className="">
                    <TableContainer
                        totalCount={data?.total ?? 0}
                        totalLength={data?.total ?? 0}
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
                                <Td> {item.tag}</Td>
                                <Td> {displayDiscount(item.discountValue, (item?.discountType ?? 'FIXED'))}</Td>
                                <Td>{item.vat}%</Td>
                                <Td className='flex items-start'> <GetStatus status={item.status || ''} /> </Td>
                                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
                            </Tr>
                        ))}
                    </TableContainer>
                </div>
            </div>
        </div >
    )
}

