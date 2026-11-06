
import { IoStatsChartSharp } from "react-icons/io5"
import { PiX } from "react-icons/pi"
import { SlPencil } from "react-icons/sl"
import GetStatus from "./GetStatus"
import { ClientNaira, humanDateFormat } from "../utils"
import { useState } from "react"
import Formbutton from "../general/Formbutton"
import { useForm } from "@mantine/form"
import NewForminput from "../general/NewForminput"

import type { deleteLayoutProps, TripEnquiryProps } from "global"
import { createResponse, NewApis } from "~/services/new-apis"
import { getAlert } from "~/services/get-alert"
import dayjs from "dayjs"

type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: TripEnquiryProps
    refetch: () => void
}

export default function TripEnquiryModal(props: componentProps) {
    const [screen, setScreen] = useState(1)
    function back() {
        setScreen(1)
    }

    const firstTraveler = props.data.travelers?.[0]


    function Headers() {
        return (
            <div className="">
                <div className="flex items-center justify-end mb-5 gap-4">
                    <div onClick={() => setScreen(3)} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-green-600 border-green-600 rounded-md" title="Update Payment Status"> <IoStatsChartSharp /> </div>
                    <div onClick={() => setScreen(2)} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-blue-600 border-blue-600 rounded-md" title="Edit Enquiry Status"> <SlPencil /> </div>
                    <div onClick={props.close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
            </div>
        )
    }


    if (screen === 3) return (
        <>
            <div className="flex items-center justify-between px-4 pt-4">
                <div className="font-bold">{ClientNaira}{props.data.Transactions?.amount?.toLocaleString()}</div>
                <Headers />
            </div>
            <UpdatTransactionInfo
                defaultStatus={props.data.Transactions?.paymentStatus || ''}
                back={back}
                close={props.close}
                id={props.data?.id || ''}
                txid={props.data.Transactions?.txid || ""}
                refetch={props.refetch}
            />
        </>
    )

    if (screen === 2) return (
        <>
            <div className="px-4 pt-4">
                <Headers />
            </div>
            <UpdatEnquiryInfo
                defaultStatus={props.data.status || ''}
                back={back}
                close={props.close}
                id={props.data.id || null}
                refetch={props.refetch}
            />
        </>
    )



    if (screen === 1) return (
        <div className="text-sm">
            <div className="grid grid-cols-2 border-b border-slate-300 pb-3 p-4">
                <div className="">
                    <div className="font-semibold">{firstTraveler?.firstName} {firstTraveler?.lastName}</div>
                    <div className="flex items-center gap-3 mt-1">
                        <div className=""> <GetStatus status={props.data.status || ''} /> </div>
                        <div className=""> <GetStatus status={props.data.Transactions?.paymentStatus || ''} /> </div>
                    </div>
                </div>
                <Headers />
            </div>
            <div className="p-4 h-[75dvh] overflow-y-auto scrolls">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-2">
                        <div className="text-slate-500">Transaction Reference</div>
                        <div className="font-bold">{props.data.Transactions?.txid}</div>
                    </div>
                    <div className="p-2">
                        <div className="text-slate-500">Contact</div>
                        <div className="font-bold">{firstTraveler?.phone}</div>
                    </div>
                </div>
                <div className="p-2">
                    <div className="text-slate-500">Email</div>
                    <div className="font-bold">{firstTraveler?.email}</div>
                </div>
                {props.data.travelers && props.data.travelers.length > 0 && props.data.travelers.map((item, index) => (
                    <div className="py-2" key={index}>
                        <div className="grid grid-cols-7 px-2">
                            <div className="text-slate-500 col-span-3">{item.tag}</div>
                            <div className="font-bold text-right col-span-4">{item.firstName} {item.lastName}</div>
                        </div>
                        <div className="grid grid-cols-7 px-2">
                            <div className="text-slate-500 col-span-3">Price @ </div>
                            <div className="font-bold text-right col-span-4">{ClientNaira}{Number(item.priceAmount || 0)?.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
                <div className="grid grid-cols-3">
                    <div className="p-2">
                        <div className="text-slate-500">Amount</div>
                        <div className="font-bold">{ClientNaira}{props.data.Transactions?.amount?.toLocaleString()}</div>
                    </div>
                    <div className="p-2">
                        <div className="text-slate-500">Status</div>
                        <div className="font-bold w-fit"> <GetStatus status={props.data.Transactions?.status || ''} /> </div>
                    </div>
                    <div className="p-2">
                        <div className="text-slate-500">Type</div>
                        <div className="font-bold">{props.data.Transactions?.paymentType?.replace('_', ' ')}</div>
                    </div>
                </div>
                <div className="p-2">
                    <div className="text-slate-500">Travel Date</div>
                    <div className="font-bold">{humanDateFormat(props.data.travelDate || '')} - {props.data.tripType?.toUpperCase()}</div>
                </div>
                {props.data.message &&
                    <div className="p-2">
                        <div className="text-slate-500">Message</div>
                        <div className="font-bold">{props.data.message}</div>
                    </div>}
            </div>
        </div>
    )
}


type updateprops = {
    defaultStatus: string
    back: () => void
    close: () => void
    refetch: () => void
    id: string | null
}

const optionValues = [
    "FULFILLED",
    "UNFULFILLED",
]

function UpdatEnquiryInfo({ defaultStatus, back, id, close, refetch }: updateprops) {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            "status": defaultStatus
        },
        validate: {
            status: value => !value ? 'Status is required' : null
        }
    })
    async function HandleSubmission(values: { status: string }) {
        try {
            const data = {
                ...values,
                id
            }
            const response = await createResponse({
                endpoint: NewApis.trips.update_enquiry,
                data: data,
                method: "PUT"
            })
            getAlert(response.message, 'success')
            close()
            refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <form onSubmit={form.onSubmit(HandleSubmission)} className="p-4">
            <div className="my-3 bg-red-100 py-1 text-xs font-medium px-2 rounded-md text-red-700">Updating enquiry status only confirms the enquiry has been fulfilled or not</div>

            <NewForminput
                formtype="select"
                content="Enquiry Status"
                options={optionValues}
                error={form.errors.status?.toString() || ''}
                {...form.getInputProps("status")}
                key={form.key("status")}
            />
            <Formbutton title="Update Enquiry Status" loading={form.submitting} Icon={SlPencil} />
            <div onClick={back} className="p-3 cursor-pointer text-center capitalize text-red-600 mt-2 hover:bg-slate-100 transition-all rounded-md">back</div>
        </form>
    )
}

type transactionprops = {
    defaultStatus: string
    back: () => void
    refetch: () => void
    close: () => void
    id: string | null
    txid: string
}

const optionHeaders = [
    "PENDING",
    "PAID",
    "PART_PAID",
]

function UpdatTransactionInfo({ defaultStatus, back, refetch, id, close, txid }: transactionprops) {
    const [isStatus, setIsStatus] = useState('')
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            "status": defaultStatus,
            paid: "",
            datePaid: null,
        },
        validate: {
            status: value => !value ? 'Status is required' : null,
            paid: (value, values) => (values.status === optionHeaders[2] && !value) ? 'Provide how much was paid' : null,
            datePaid: (value, values) => (values.status === optionHeaders[2] && !value) ? 'Payment date is required' : null,
        }
    })

    form.watch("status", (value) => setIsStatus(value.value))

    async function HandleSubmission(values: { status: string }) {
        try {
            const data = {
                ...values,
                id,
                txid
            }
            const response = await createResponse({
                endpoint: NewApis.trips.update_transaction,
                method: "PUT",
                data
            })
            getAlert(response.message, 'success')
            close()
            refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <form onSubmit={form.onSubmit(HandleSubmission)} className="px-4">
            <NewForminput
                formtype="select"
                options={optionHeaders}
                {...form.getInputProps("status")}
                key={form.key("status")}
                error={form.errors.status?.toString() || ''}
                content="Transaction Status"
            />
            {isStatus === optionHeaders[2] && <>
                <NewForminput
                    {...form.getInputProps("paid")}
                    content="Paid"
                    error={form.errors.paid?.toString() || ''}
                    key={form.key("paid")}
                />
                <NewForminput
                    content="Date Paid"
                    formtype="date"
                    maxDate={dayjs().format("YYYY-MM-DD")}
                    valueName="datePaid"
                    error={form.errors.datePaid?.toString() || ''}
                    valueText={form.values.datePaid}
                    onChange={(e: any) => form.setFieldValue("datePaid", e)}
                    setFieldValue={form.setFieldValue}
                />
                <div className="bg-orange-100/40 text-orange-700 py-2 px-3 rounded-md border border-orange-200 mb-3 text-xs">
                    This will create a transaction timeline to track break downs of how payment was completed
                </div>
            </>}
            <Formbutton title="Update Transaction Status" loading={form.submitting} Icon={SlPencil} />
            <div onClick={back} className="p-3 cursor-pointer text-center capitalize text-red-600 mt-2 hover:bg-slate-100 transition-all rounded-md">back</div>
        </form>
    )
}
