

import type { deleteLayoutProps, visaEnquiryProps } from "global"
import { PiX } from "react-icons/pi"
import { SlPencil } from "react-icons/sl"
import { useState } from "react"
import { FaMinus } from "react-icons/fa6"
import { useForm } from "@mantine/form"
import { getAlert } from "~/services/get-alert"
import { createResponse, NewApis } from "~/services/new-apis"
import GetStatus from "~/components/admin/GetStatus"
import { ClientNaira, humanDateFormat, IsaNumber } from "~/components/utils"
import NewForminput from "~/components/general/NewForminput"
import Formbutton from "~/components/general/Formbutton"
import { IoStatsChartSharp } from "react-icons/io5"
import PaymentStatusForm from "~/components/admin/payment-status-form"
import dayjs from "dayjs"


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: visaEnquiryProps
    refetch: () => void
    readOnly: boolean
}

export default function VisaEnquiryModal(props: componentProps) {
    const [screen, setScreen] = useState(1)

    function back() {
        setScreen(1)
    }


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
                <div className="font-bold">{props.data.Transaction ? `${ClientNaira}${props.data.Transaction?.amount?.toLocaleString()}` : 'Enquiry · no invoice yet'}</div>
                <Headers />
            </div>
            <UpdatTransactionInfo
                defaultStatus={props.data.Transaction?.paymentStatus || ''}
                back={back}
                close={props.close}
                id={String(props.data?.id)}
                txid={props.data.Transaction?.txid || ""}
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
            <div className="grid grid-cols-2 border-b border-slate-300 p-4">
                <div className="">
                    <div className="font-semibold">{props.data.firstName}</div>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center text-xs font-bold gap-2"> Visa Status: <GetStatus status={props.data.status || ''} /> </div>
                    </div>
                </div>
                <Headers />
            </div>
            <div className="p-4 h-[75dvh] scrolls overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2">
                        <div className="text-slate-500">Nationality</div>
                        <div className="font-bold">{props.data.nationality ?? <FaMinus />}</div>
                    </div>
                    <div className="p-2 text-right">
                        <div className="text-slate-500">Payment Status</div>
                        <div className="font-bold size-fit ml-auto"> <GetStatus status={props.data.Transaction?.paymentStatus || ''} /> </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2">
                        <div className="text-slate-500">Visa Type</div>
                        <div className="font-bold">{props.data.visa?.visaType ?? <FaMinus />}</div>
                    </div>
                    <div className="p-2 text-right">
                        <div className="text-slate-500">Destination</div>
                        <div className="font-bold">{props.data.visa?.country ?? <FaMinus />}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2">
                        <div className="text-slate-500">Amount Paid</div>
                        <div className="font-bold">{IsaNumber(props.data?.visa?.amount || '') ?? <FaMinus />}</div>
                    </div>
                    <div className="p-2 text-right">
                        <div className="text-slate-500">Payment For</div>
                        <div className="font-bold">{props.data.visa?.paymentType ?? <FaMinus />}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2">
                        <div className="text-slate-500">Contact</div>
                        <div className="font-bold">{props.data.phone}</div>
                    </div>
                    <div className="p-2 text-right">
                        <div className="text-slate-500">Travel Date</div>
                        <div className="font-bold">{humanDateFormat(props.data.travelDate || '')}</div>
                    </div>
                </div>
                <div className="p-2">
                    <div className="text-slate-500">Email</div>
                    <div className="font-bold">{props.data.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2">
                        <div className="text-slate-500">Has passport</div>
                        <div className="font-bold">{props.data.hasPassport?.toUpperCase()}</div>
                    </div>
                    {props.data.hasPassport === 'yes' && <div className="p-2 text-right">
                        <div className="text-slate-500">Passport Number</div>
                        <div className="font-bold"> {props.data.passportNumber} </div>
                    </div>}
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
    id: number | null
}

const optionValues = [
    "pending",
    "approved",
    "rejected",
]

function UpdatEnquiryInfo({ defaultStatus, back, id, close, refetch }: updateprops) {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            "status": defaultStatus
        },
        validate: {
            status: value => !value ? 'Enquiry status is required' : null
        }
    })

    async function HandleSubmission(values: { status: string }) {
        try {
            const data = {
                status: values.status,
                id
            }
            const response = await createResponse({
                endpoint: NewApis.visa.update_enquiry,
                data,
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
        <form onSubmit={form.onSubmit(HandleSubmission)} className="px-4 pb-4">
            <NewForminput
                formtype="select"
                {...form.getInputProps("status")}
                error={form.errors.status?.toString() || ''}
                options={optionValues}
                content="Enquiry Status"
            />
            <Formbutton title="Update Enquiry Status" loading={form.submitting} Icon={SlPencil} />
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

/** Records the payment for a visa application; enquiries without an invoice get one from the agreed amount */
function UpdatTransactionInfo({ defaultStatus, back, refetch, id, close, txid }: transactionprops) {
    return (
        <div className="px-4 pb-4">
            <PaymentStatusForm
                currentStatus={defaultStatus || null}
                currency="NGN"
                needsAmount={!txid}
                onSubmit={(values) => createResponse({ endpoint: NewApis.visa.update_transaction, method: "PUT", data: { ...values, id, txid: txid || undefined } })}
                onDone={() => { close(); refetch() }}
            />
            <div onClick={back} className="p-3 cursor-pointer text-center capitalize text-red-600 mt-2 hover:bg-slate-100 transition-all rounded-md">back</div>
        </div>
    )
}
