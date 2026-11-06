import type { tripInfoProps } from 'global'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import PaymentOptions from '~/components/payment/payment-options'
import VoucherInput, { type VoucherPreview } from '~/components/payment/voucher-input'
import ViewTripSummary from '~/routes/general/packages/form/view-trip-summary'
import { createResponse, NewApis } from '~/services/new-apis'

type quoteProps = {
    currency: string
    subtotal: number
    fees: number
    total: number
    discount: number
    payable: number
}

type props = {
    fields: tripInfoProps | undefined;
    sendData: (value: string, voucherCode?: string) => void;
}

const money = (amount: number, currency: string) => `${currency} ${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

export default function StageThree(props: props) {
    const [voucher, setVoucher] = React.useState<VoucherPreview | null>(null)
    const travelers = (props.fields?.form?.travelers ?? []).map(({ tag, priceType, priceAmount }) => ({ tag, priceType, priceAmount }))
    const currency = props.fields?.package?.currency ?? 'NGN'

    // The server prices the order (markup, VAT, currency); this is exactly what will be charged
    const quote = useQuery<quoteProps>({
        queryKey: ['package-quote', props.fields?.package?.id, JSON.stringify(travelers), currency, voucher?.code],
        queryFn: () => createResponse({
            endpoint: NewApis.trips.quote,
            method: 'POST',
            data: { tripId: props.fields?.package?.id, travelers, currency, voucher_code: voucher?.code },
        }),
        enabled: Boolean(props.fields?.package?.id),
        retry: false,
    })

    return (
        <div>
            <ViewTripSummary info={props.fields} />
            <div className='bg-white border border-slate-200 p-4 md:rounded-lg mb-3 space-y-3'>
                <div className="font-bold text-gray-500 text-right">Price breakdown</div>
                {quote.isLoading && <Skeleton count={3} height={20} />}
                {quote.isError && <div className="text-sm text-red-600">{(quote.error as Error).message}</div>}
                {quote.data && (
                    <div className="text-sm space-y-1.5">
                        <div className="flex justify-between"><span className="text-zinc-600">Package price</span><span className="tabular-nums">{money(quote.data.subtotal, quote.data.currency)}</span></div>
                        {quote.data.fees > 0 && <div className="flex justify-between"><span className="text-zinc-600">Service fee and VAT</span><span className="tabular-nums">{money(quote.data.fees, quote.data.currency)}</span></div>}
                        {quote.data.discount > 0 && <div className="flex justify-between text-green-700"><span>Voucher {voucher?.code}</span><span className="tabular-nums">- {money(quote.data.discount, quote.data.currency)}</span></div>}
                        <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 text-base font-bold"><span>Total to pay</span><span className="tabular-nums">{money(quote.data.payable, quote.data.currency)}</span></div>
                    </div>
                )}
                {quote.data && (
                    <VoucherInput
                        service="TRIP"
                        amount={quote.data.total}
                        currency={quote.data.currency}
                        value={voucher}
                        onChange={setVoucher}
                    />
                )}
            </div>
            <div className='bg-white border border-slate-200 p-4 md:rounded-lg'>
                <PaymentOptions
                    sendData={(method) => props.sendData(method, voucher?.code)}
                />
            </div>
        </div>
    )
}
