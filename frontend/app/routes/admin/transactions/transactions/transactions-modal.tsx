import PaymentStatusForm from '~/components/admin/payment-status-form'
import GatewayDetails from '~/components/payment/gateway-details'
import { createResponse, NewApis } from '~/services/new-apis'
// import { Image } from 'antd'
// import type { TransactionProps } from 'global'
// import GetStatus from '~/components/admin/GetStatus'
// import Linked from '~/components/general/Linked'
// import { ClientNaira } from '~/components/utils'

import type { TransactionProps } from "global";
import GetStatus from "~/components/admin/GetStatus";
import Marker from "~/components/pageComponent/Marker";
import { humanDateTimeFormat } from "~/components/utils";


// export default function TransactionsModal({ single }: props) {

//     return (
//         <div className="text-sm space-y-4 p-4 max-h-[80dvh] overflow-y-auto scrolls">
//             <div className="grid grid-cols-2 gap-3">
//                 <div className="">
//                     <div className="text-slate-500">Amount</div>
//                     <div className="font-semibold">{ClientNaira}{single.amount?.toLocaleString()}</div>
//                 </div>
//                 <div className="text-right">
//                     <div className="text-slate-500">Type</div>
//                     <div className="font-semibold">{single.txType}</div>
//                 </div>
//             </div>
//             <div className="">
//                 <div className="text-slate-500">Reference</div>
//                 <div className="font-semibold">{single.txid}</div>
//             </div>
//             <div className="grid grid-cols-3 gap-2">
//                 <div className="space-y-2 flex flex-col items-start">
//                     <div className="text-slate-500">Status</div>
//                     <div className="font-semibold"> <GetStatus status={single.status || ''} /> </div>
//                 </div>
//                 <div className="space-y-2 flex flex-col items-start">
//                     <div className="text-slate-500">Payment Status</div>
//                     <div className="font-semibold"> <GetStatus status={single.paymentStatus || ''} /> </div>
//                 </div>
//                 <div className="space-y-2 flex flex-col items-start">
//                     <div className="text-slate-500">Payment Type</div>
//                     <div className="font-semibold"> {single.paymentType?.split("_")?.join(" ")} </div>
//                 </div>
//             </div>

//            {single?.declineReason && <div className="space-y-2 flex flex-col items-start">
//                 <div className="text-slate-500">Reason for being Declined</div>
//                 <div className="font-semibold"> {single.declineReason} </div>
//             </div>}
//             <div className="flex items-center justify-between gap-2">
//                 <div className="text-slate-500">Timeline ({single.TransactionTimelines?.length || 0})</div>
//                 {(single.TransactionTimelines && Number(single.TransactionTimelines?.length) > 0) ? <div className=" text-blue-600 underline"> <Linked to={`/admin-portal/transactions/${single.txid}/timeline`}>View Timeline</Linked> </div> : ""}
//             </div>
//             <div className="">
//                 <div className="text-slate-500">Payment Slip</div>
//                 <div className="">{single?.image ? <div className="w-full h-60 overflow-hidden">
//                     <Image src={single?.image} className='w-full h-60' />
//                 </div> : <div className="text-red-700 py-2 px-3 rounded-md bg-red-100/60 size-fit text-xs mt-3 border border-red-200!">Unavailable</div>} </div>
//             </div>
//         </div>
//     )
// }


type props = {
    data: TransactionProps;
    onUpdated?: () => void;
}

export default function TransactionsModal(props: props) {
    const actual = Number(props.data?.charge?.amount || 0) - ((Number(props.data?.charge?.vat || 0) + Number(props.data?.charge?.markup_value || 0)))
    return (
        <div>
            <div className="p-4 space-y-3 h-[90dvh] overflow-y-auto">
                {Object.keys(props.data || {}).map((item, idx) => {
                    const getValue = String(Object.values(props.data || {})[idx])
                    const value = item?.toLowerCase()?.endsWith('at')
                        ? humanDateTimeFormat(getValue)
                        : ["paymentstatus", 'status'].includes(item?.toLowerCase())
                            ? <div className="size-fit ml-auto"> <GetStatus status={getValue || ''} /> </div>
                            : getValue?.split("_")?.join(" ")

                    const excludes = (!item?.toLowerCase()?.endsWith('id')) && !['charge', 'updatedat', 'gatewayresponse'].includes(item?.toLowerCase()) && (getValue !== "null")
                    if (excludes) return (
                        <div key={idx} className="grid grid-cols-8 wrap-break-word">
                            <div className="col-span-3 capitalize text-gray-500">{item?.split("_")?.join(" ")}</div>
                            <div className="col-span-5 text-right">{value}</div>
                        </div>
                    )
                })}
                <Marker title="Charge" />
                {Object.keys(props.data.charge || {}).map((item, idx) => {
                    const rawValue = Object.values(props.data.charge || {})[idx]
                    const getValue = String(rawValue)
                    const value = (item?.toLowerCase()?.endsWith("value") || item?.toLowerCase()?.endsWith("vat"))
                        ? `${getValue}%`
                        : (typeof rawValue === "number")
                            ? `${props.data?.charge?.currency} ${Number(getValue || 0)?.toLocaleString()}`
                            : getValue?.split("_")?.join(" ")

                    return (
                        <div key={idx} className="grid grid-cols-8 wrap-break-word">
                            <div className="col-span-3 capitalize text-gray-500">{item?.split("_")?.join(" ")}</div>
                            <div className="col-span-5 text-right">{value}</div>
                        </div>
                    )
                })}
                <div className="grid grid-cols-8 wrap-break-word">
                    <div className="col-span-3 capitalize text-gray-500">Actual Amount Paid</div>
                    <div className="col-span-5 text-right">{props.data?.charge?.currency} {Number(actual || 0)?.toLocaleString()}</div>
                </div>
                {props.data?.gatewayResponse && !Array.isArray(props.data.gatewayResponse) && <>
                    <Marker title="Gateway record" />
                    <GatewayDetails record={props.data.gatewayResponse} title="Unified Payment status record" />
                    <details className="text-xs">
                        <summary className="cursor-pointer text-zinc-500">Raw gateway JSON (kept for disputes)</summary>
                        <pre className="mt-2 p-2 bg-slate-50 rounded-md overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(props.data.gatewayResponse, null, 2)}</pre>
                    </details>
                </>}
                {props.data?.id && <>
                    <Marker title="Update payment" />
                    <PaymentStatusForm
                        currentStatus={props.data.paymentStatus}
                        currency={props.data?.charge?.currency}
                        onSubmit={(values) => createResponse({ endpoint: NewApis.transactions.payment_status(String(props.data.id)), method: 'PUT', data: values })}
                        onDone={props.onUpdated}
                    />
                </>}
            </div>
        </div>
    )
}
