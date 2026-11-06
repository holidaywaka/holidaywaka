import React from 'react';
import { Minus } from 'iconsax-reactjs';
import PaymentOptions from '~/components/payment/payment-options'
import VoucherInput, { type VoucherPreview } from '~/components/payment/voucher-input'
import { IsaNumber } from '~/components/utils';
import type { fieldProps } from '~/routes/general/visa/types'

type props = {
    data: fieldProps | undefined;
    sendData: (value: string, voucherCode?: string) => void;
}
export default function VisaThirdScreen(props: props) {
    const isAppointment = props.data?.paymentType === "appointment"
    const context = isAppointment ? 'an appointment' : 'a full visa process'
    const [voucher, setVoucher] = React.useState<VoucherPreview | null>(null)
    const amountDue = Number(isAppointment ? props.data?.fee : props.data?.price) || 0

    return (
        <div className='space-y-3'>
            <div className="border border-gray-300 p-3 rounded-lg">
                <div className="text-slate-500">Request for {context} on</div>
                <div className="font-bold text-lg">{props.data?.country} <Minus className='inline' /> {props.data?.visaType} </div>
                {props.data?.requirement && <div className="whitespace-pre-wrap text-xs bg-slate-100 p-3 rounded-lg border border-gray-300 mb-3">
                    <div className="font-bold">Requirements:</div>
                    {props.data?.requirement}</div>}
                <div className="font-bold text-xl flex items-center justify-between"> <span className="text-sm text-gray-500 font-medium">Amount Due: </span> {IsaNumber(String(isAppointment ? props.data?.fee : props.data?.price))}</div>
                <div className="text-xs mt-5 w-[98%] mx-auto p-3 bg-slate-100 mb-2 rounded-lg border border-gray-300">
                    <div className="">
                        You may schedule an appointment to speak with an agent before proceeding, or make full payment to initiate your visa application immediately.
                    </div>
                    <div className="mt-3">
                        Please note that the appointment fee will be deducted from your total visa application fee.
                    </div>
                </div>
            </div>
            <VoucherInput service="VISA" amount={amountDue} currency="NGN" value={voucher} onChange={setVoucher} />
            {voucher && <div className="text-xs text-zinc-500">The discount is applied to your final total at checkout.</div>}
            <PaymentOptions
                sendData={(method) => props.sendData(method, voucher?.code)}
            />
        </div>
    )
}
