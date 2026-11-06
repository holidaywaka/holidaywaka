import React from 'react'
import { FiCheck, FiTag, FiX } from 'react-icons/fi'
import { createResponse, NewApis } from '~/services/new-apis'

export type VoucherPreview = {
    code: string;
    discount_type: string;
    discount_value: number;
    discount: number;
    payable: number;
    currency: string;
}

type props = {
    /** Transaction type the code must be valid for: TRIP, VISA, HOTEL, TRANSFER, CHAUFFEUR */
    service: string;
    amount: number;
    currency: string;
    /** NGN per USD, so fixed (NGN) vouchers can be applied to USD totals */
    rate?: number;
    value: VoucherPreview | null;
    onChange: (value: VoucherPreview | null) => void;
}

const money = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

/** Voucher code field: validates with the server (nothing is reserved until the order is placed) */
export default function VoucherInput(props: props) {
    const [code, setCode] = React.useState(props.value?.code ?? '')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    async function apply() {
        const trimmed = code.trim()
        if (!trimmed) return setError('Enter a voucher code')
        setLoading(true)
        setError('')
        try {
            const result: VoucherPreview = await createResponse({
                endpoint: NewApis.voucher.preview,
                method: 'POST',
                data: { code: trimmed, service: props.service, amount: props.amount, currency: props.currency, rate: props.rate },
            })
            props.onChange(result)
        } catch (err) {
            props.onChange(null)
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    function remove() {
        props.onChange(null)
        setCode('')
        setError('')
    }

    if (props.value) return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2 text-green-800">
                <FiCheck className="shrink-0" />
                <span><span className="font-semibold">{props.value.code}</span> applied · you save {money(props.value.discount, props.value.currency)}</span>
            </div>
            <button type="button" onClick={remove} aria-label="Remove voucher" className="text-green-800 hover:text-green-950 cursor-pointer"><FiX /></button>
        </div>
    )

    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor={`voucher-${props.service}`}>Voucher code</label>
            <div className="flex gap-2">
                <div className={`flex flex-1 items-center gap-2 h-11 px-3 rounded-lg border bg-white ${error ? 'border-red-400' : 'border-gray-300 focus-within:border-primary'}`}>
                    <FiTag className="shrink-0 text-zinc-400" />
                    <input
                        id={`voucher-${props.service}`}
                        value={code}
                        onChange={(event) => { setCode(event.target.value.toUpperCase()); setError('') }}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); apply() } }}
                        placeholder="Enter code"
                        autoComplete="off"
                        className="w-full min-w-0 bg-transparent text-sm! uppercase outline-none" />
                </div>
                <button type="button" onClick={apply} disabled={loading || !props.amount} className="h-11 px-4 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                    {loading ? 'Checking...' : 'Apply'}
                </button>
            </div>
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </div>
    )
}
