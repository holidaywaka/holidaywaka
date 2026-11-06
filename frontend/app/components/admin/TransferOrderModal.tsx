
import React from 'react'
import { ClientTransactionStatusOptions, displayTransferPriceWithoutService, humanDateTimeFormat, modalStyle, SiteName, sumServicesTotal } from '../utils'
import { PiX } from 'react-icons/pi'
import { useDisclosure } from '@mantine/hooks'
import { Modal } from '@mantine/core'
import Formbutton from '../general/Formbutton'

import type { deleteLayoutProps, transferOrder } from "global"
import Marker from '../pageComponent/Marker'
import GetStatus from './GetStatus'
import { Chart, People } from 'iconsax-reactjs'
import { FaTrash } from 'react-icons/fa6'
import Currencies from '~/components/general/Currencies'
import { convert } from 'html-to-text'
import CancelTransferOrder from '~/components/admin/CancelTransferOrder'
import { Image } from 'antd'
import { useForm } from '@mantine/form'
import NewForminput from '~/components/general/NewForminput'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'
import dayjs from 'dayjs'


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: transferOrder
    refetch: () => void
    readOnly: boolean
}

export default function TransferOrderModal(props: componentProps) {
    const getCurrency = Currencies.find(ele => ele.abbreviation === props.data?.charge?.currency)?.symbol
    const currency = convert(getCurrency || '')
    const getCurrency2 = Currencies.find(ele => ele.abbreviation === props.data?.trips?.[0]?.currency)?.symbol
    const actualCurrency = convert(getCurrency2 || '')

    const [dups, setDups] = useDisclosure(false)
    const [stats, setStats] = useDisclosure(false)
    const [subs, setSubs] = useDisclosure(false)
    const [loading, setLoading] = React.useState(false)

    async function HandleSubmission() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.v4.payment_link,
                method: "POST",
                data: {order_id: props.data?.order_id}
            })
            setDups.close()
            props.close()
            setTimeout(() => {
                window.open(response.message, "_blank")
            }, 500)
        } catch (error) {
            getAlert(`${(error as Error).message}`, "error")
        } finally {
            setLoading(false)
        }
    }

    function closeAll() {
        props.close()
        props.refetch()
    }


    return (
        <>
            <Modal onClose={setSubs.close} opened={subs} styles={modalStyle} title="Update Transfer Submitted">
                <div className="p-4">
                    <UpdateTransaction
                        close={setSubs.close}
                        closeAll={closeAll}
                        paymentStatus={String(props.data?.Transactions?.paymentStatus)}
                        options={Object.values(ClientTransactionStatusOptions)}
                        transactionID={String(props.data?.Transactions?.id)}
                        transferID={String(props.data?.id)}
                    />
                </div>
            </Modal>
            <Modal onClose={setStats.close} opened={stats} styles={modalStyle} title={<div className="">Kindly confirm your request to pay the sum of <b>{actualCurrency}{Number(props.data?.payable)?.toLocaleString()}</b> </div>}>
                <div className="p-4 border-t border-gray-300">
                    <div className="w-fit ml-auto mt-5">
                        <Formbutton title="Proceed to Payment" onClick={HandleSubmission} loading={loading} />
                    </div>
                </div>
            </Modal>
            <Modal onClose={setDups.close} opened={dups} styles={modalStyle} centered>
                <CancelTransferOrder {...props} onClose={setDups.close} />
            </Modal>
            <div className='text-xs pb-10 h-[95dvh] overflow-y-auto overflow-x-hidden px-4 pt-4 scrolls'>
                <div className="flex items-center justify-end mb-4 gap-4">

                    {props.data?.Transactions?.paymentStatus === ClientTransactionStatusOptions.submitted && <div onClick={() => setSubs.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-blue-600 border-blue-600 rounded-md" title="Update Transaction Status"> <Chart size="18" /> </div>}

                    {props.data.trips?.[0]?.payable_status?.toLowerCase() === ClientTransactionStatusOptions.paid?.toLowerCase() && <div onClick={() => setDups.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-red-600 border-red-600 rounded-md" title="Make Payment"> <FaTrash /> </div>}

                    <div onClick={props.close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 py-1">
                        <div className="">Order ID:</div>
                        <div className="text-right capitalize">{props.data?.order_id}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1">
                        <div className="">Booking Code:</div>
                        <div className="text-right capitalize">{props.data.trips?.[0]?.bookingCode}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1">
                        <div className="">Date Created</div>
                        <div className="text-right capitalize">{humanDateTimeFormat(props.data?.createdAt || '')}</div>
                    </div>

                    <div className="">
                        {props.data?.trips?.map((item, index) => {
                            return (
                                <div className="" key={index}>
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        <div className="">Iway Transaction ID</div>
                                        <div className="text-right capitalize">{item.transaction}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        <div className="">Booking Status</div>
                                        <div className="text-right capitalize"><GetStatus status={item.status || ''} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        <div className="">Expiry Date</div>
                                        <div className="text-right capitalize">{humanDateTimeFormat(dayjs(props.data?.createdAt).add(Number(item.cancellation_time?.split(" ")[0]), "hours").toString() || '')}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        <div className="">Payment Status to {SiteName}</div>
                                        <div className="text-right capitalize size-fit ml-auto"><GetStatus status={props.data?.Transactions?.paymentStatus || ''} /> </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        <div className="">Payment Status to {item.service_provider}</div>
                                        <div className="text-right capitalize size-fit ml-auto"><GetStatus status={item.payable_status || ''} /></div>
                                    </div>
                                    <Marker title="Pickup Address" />
                                    <div className="">
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Pickup Type</div>
                                            <div className="text-right capitalize">{item.service_id}</div>
                                        </div>
                                        {item.service_id?.startsWith('chauffeur') && <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Service Duration</div>
                                            <div className="text-right capitalize">{item.duration} Hours</div>
                                        </div>}
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Pickup from</div>
                                            <div className="text-right">{item.origin?.type}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Arrival Date</div>
                                            <div className="text-right">{dayjs(item.date_arrival).format("Do MMM, YYYY | hh:mm A")}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Address</div>
                                            <div className="text-right">{item.origin?.address}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Location</div>
                                            <div className="text-right">{item.origin?.city}, {item.origin?.title}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Flight Number</div>
                                            <div className="text-right">{item.origin?.flight_number}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Terminal Number</div>
                                            <div className="text-right">{item.origin?.terminal_number}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Place ID</div>
                                            <div className="text-right">{item.origin?.place_id}</div>
                                        </div>
                                    </div>
                                    <Marker title="Drop off Address" />
                                    <div className="">
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Drop off</div>
                                            <div className="text-right">{item.destination?.type}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Address</div>
                                            <div className="text-right">{item.destination?.address}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Location</div>
                                            <div className="text-right">{item.destination?.city}, {item.destination?.title}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Place ID</div>
                                            <div className="text-right">{item.destination?.place_id}</div>
                                        </div>
                                    </div>
                                    <Marker title="Pricing Information" />
                                    <div className="">
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Charged</div>
                                            <div className="text-right"> {currency}{Number(props.data?.charge?.amount)?.toLocaleString()}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Actual Price</div>
                                            <div className="text-right"> {actualCurrency}{Number(item.price)?.toLocaleString()}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Actual Price (- Services)</div>
                                            <div className="text-right"> {actualCurrency}{displayTransferPriceWithoutService(item.additional_services, item.price ?? 0)?.toLocaleString()}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Services (Total)</div>
                                            <div className="text-right">{actualCurrency}{sumServicesTotal(item.additional_services)?.toLocaleString()}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Markup</div>
                                            <div className="text-right">{props.data?.markup}</div>
                                        </div>
                                    </div>
                                    <Marker title="Additional Services" />
                                    <div className="">
                                        {item.additional_services?.map((ele, index) => (
                                            <div className='mb-4' key={index}>
                                                <div className="grid grid-cols-2 gap-2 py-1">
                                                    <div className="capitalize">{ele.type?.replace("_", " ")}</div>
                                                    <div className="text-right"> <sup>{item.currency}</sup> {Number(ele.price)?.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Marker title="Car Information" />
                                    <div className="">
                                        <div className="grid grid-cols-2 gap-2 py-1 items-center">
                                            <div className="">Photo</div>
                                            <div className="size-fit ml-auto"> <img src={item.car_photo} loading='lazy' alt="" className="h-6 w-auto" /> </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Title</div>
                                            <div className="text-right">{item.car_title}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Models</div>
                                            <div className="text-right">{item.car_models}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Capacity</div>
                                            <div className="text-right flex items-center justify-end gap-1">{item.car_capacity} <People size="17" /> </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Service</div>
                                            <div className="text-right uppercase">{item.service_id}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 py-1">
                                            <div className="">Passengers</div>
                                            <div className="text-right">
                                                <div>Adults <b>({item.total_adults})</b></div>
                                                <div>Children <b>({item.total_children})</b></div>
                                            </div>
                                        </div>
                                    </div>
                                    <Marker title="Passengers" />
                                    <div className="">
                                        {item.passengers?.map((ele, index) => (
                                            <div className='mb-4' key={index}>
                                                <div className="grid grid-cols-2 gap-2 py-1">
                                                    <div className="">Full Name</div>
                                                    <div className="text-right">{ele.name}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 py-1">
                                                    <div className="">Phone</div>
                                                    <div className="text-right">{ele.phone}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 py-1">
                                                    <div className="">Email</div>
                                                    <div className="text-right">{ele.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <Marker title="Transaction Details" />
                    <div className="">
                        <div className="grid grid-cols-2 gap-2 py-1">
                            <div className="">Status</div>
                            <div className="text-right">{props.data?.Transactions?.status}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 py-1">
                            <div className="">Payment Status</div>
                            <div className="text-right">{props.data?.Transactions?.paymentStatus}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 py-1">
                            <div className="">Transaction ID</div>
                            <div className="text-right">{props.data?.Transactions?.txid}</div>
                        </div>
                        <div className="py-1">
                            <div className="">Payment Screenshot</div>
                            {!props.data?.Transactions?.image ? "Nil" : <div className="bg-slate-300">
                                <div className="bg-zinc-700 size-fit mx-auto mt-5">
                                    <Image src={props.data?.Transactions?.image} loading="lazy" className="h-32! mx-auto! w-full object-cover" />
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


type Props = {
    paymentStatus: string
    options: string[]
    transactionID: string
    transferID: string
    close: () => void
    closeAll: () => void
}

function UpdateTransaction(props: Props) {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            paymentStatus: props.paymentStatus || ''
        },
        validate: {
            paymentStatus: value => !value ? 'Payment Status is required' : null
        }
    })

    async function HandleSUbmission(values: typeof form.values) {
        try {
            const body = {
                transactionID: props.transactionID,
                transferID: props.transferID,
                paymentStatus: values.paymentStatus
            }

            const response = await createResponse({
                endpoint: NewApis.v4.update_payment,
                data: body,
                method: "PUT"
            })
            getAlert(response.message, "success")
            props.close()
            props.closeAll()
        } catch (error) {
            getAlert((error as Error).message, "error")
        }
    }
    return (
        <form onSubmit={form.onSubmit(HandleSUbmission)}>
            <NewForminput
                content="Select Status"
                formtype="select"
                options={props.options}
                error={form.errors.paymentStatus?.toString() || ''}
                {...form.getInputProps("paymentStatus")}
                key={form.key("paymentStatus")}
            />
            <Formbutton
                title="Update"
                loading={form.submitting}
            />
        </form>
    )
}

