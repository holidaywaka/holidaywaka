
import { Drawer, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { transferOrder } from 'global'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { ClientTransactionStatusOptions, humanDateTimeFormat, modalStyle, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import TransferOrderModal from '~/components/admin/TransferOrderModal'
import { convert } from 'html-to-text'
import Currencies from '~/components/general/Currencies'
import FixedLoader from '~/components/general/FixedLoader'
import Formbutton from '~/components/general/Formbutton'
import useFetchResponse from '~/services/fetchResponse'
import { createResponse, NewApis } from '~/services/new-apis'
import { getAlert } from '~/services/get-alert'


export function meta() {
    return [
        { title: `(0) Transfer Orders` },
        { name: "description", content: "Transfers" }
    ];
}

const Headers = [
    "Booking Code",
    "Service Type",
    "Actual Price",
    "Charged",
    "Total Passengers",
    "Order Status",
    "Customer Payment",
    "Admin Payment",
    "Date Created",
]

type responseProps = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    data: transferOrder[]
}

export default function FlightBookings() {
    const [opened, { open, close }] = useDisclosure(false)
    const [opens, setOpens] = useDisclosure(false)
    const [searchParams,] = useSearchParams()
    const [single, setSingle] = useState<transferOrder>({})
    const isSearch = ""
    const [loading, setLoading] = useState(false)
    const [deleteText, setDeletetext] = useState({
        subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
        title: 'Cancel Flight Reservation',
        status: true,
        actionText: "Cancel Reservation"
    })
    const emptytext = {
        emptyTitle: "No Transfer Orders yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Flight Bookings match your search",
        icon: "/images/emptyflight.svg"
    }

    const { data, isLoading, refetch } = useFetchResponse<responseProps>({
        endpoint: NewApis.v4.all_orders,
        isSearch: true,
        header: "Transfers"
    })

    function pageAction() {
        refetch()
    }

    function HandleNewAction() {
        open()
        setSingle({})
    }

    function HandleViewing(item: transferOrder) {
        open()
        setSingle(item)
        setDeletetext({
            ...deleteText, status: false
        })
    }


    async function HandleResyncAction() {
        try {
            close()
            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.v4.verify_order,
                method: "POST",
                data: { order_id: single.order_id }
            })
            getAlert(response.message, "success")
            refetch()
        } catch (error) {
            getAlert((error as Error).message, "error")
        } finally {
            setLoading(false)
            onClose()
        }
    }

    function OpenApprovalModal(item: transferOrder) {
        setSingle(item)
        setOpens.open()
    }

    function onClose() {
        setOpens.close()
        setSingle({})
    }


    return (
        <div>
            <Modal styles={modalStyle} onClose={onClose} opened={opens} centered title="Approve Order">
                <div className="p-5">
                    <div className="">Kindly confirm your request to approve this order</div>
                    <div className="grid grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-300">
                        <Formbutton title="Cancel" bg="bg-slate-400 text-white" onClick={onClose} />
                        <Formbutton title="Proceed" onClick={HandleResyncAction} loading={loading} />
                    </div>
                </div>
            </Modal>
            <FixedLoader title="Re-syncing your data, do hold on..." loading={loading} />
            <Drawer opened={opened} onClose={close} offset={8} position="right" withCloseButton={false} styles={drawerStyle}>
                <TransferOrderModal
                    close={() => close()}
                    title={single?.id ? "Service details" : ""}
                    isDelete={null}
                    data={single}
                    readOnly={false}
                    refetch={refetch}
                />
            </Drawer>
            <AHeader
                title="Transfers"
                subtitle="View and manage all Transfers"
            />
            <div className="w-[96%] mx-auto">
                <NavLinks options={["home", "transfers"]}
                    header='Total Transfers'
                    total={Number(data?.total ?? 0)}
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
                        {data?.data?.filter(ele => Number(ele.trips?.length) > 0)?.map((itemValue, index) => {
                            const item = itemValue.trips?.[0]
                            const getCurrency = Currencies.find(ele => ele.abbreviation === itemValue.charge?.currency)?.symbol
                            const currency = convert(getCurrency || '')
                            const getCurrency2 = Currencies.find(ele => ele.abbreviation === item?.currency)?.symbol
                            const currency2 = convert(getCurrency2 || '')
                            return (
                                <Tr
                                    actions={['more']}
                                    footer={index === data?.data?.length - 1 ? true : false}
                                    key={index}
                                    actionChildren={<>
                                        <Tpop onClick={() => HandleViewing(itemValue)}>View</Tpop>
                                        {item?.payable_status?.toLowerCase() !== ClientTransactionStatusOptions.paid?.toLowerCase() && <Tpop onClick={() => OpenApprovalModal(itemValue)}>Approve Order</Tpop>}
                                    </>}
                                >
                                    <Td>{item?.bookingCode}</Td>
                                    <Td className='uppercase'>{item?.service_id}</Td>
                                    <Td> {currency2}{itemValue?.payable?.toLocaleString()}</Td>
                                    <Td> {currency}{Number(itemValue?.charge?.amount)?.toLocaleString()}</Td>
                                    <Td>{item?.passengers?.length}</Td>
                                    <Td> <GetStatus status={item?.status || ''} /> </Td>
                                    <Td> <GetStatus status={itemValue.Transactions?.paymentStatus || ''} /> </Td>
                                    <Td> <GetStatus status={item?.payable_status || ''} /> </Td>
                                    <Td className="p-3 text-right"> {humanDateTimeFormat(itemValue.createdAt || '')} </Td>
                                </Tr>
                            )
                        })}
                    </TableContainer>
                </div>
            </div>
        </div >
    )
}
