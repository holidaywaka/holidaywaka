import React from 'react'
import dayjs from 'dayjs'
import { getAlert } from '~/services/get-alert'

export type PaymentStatusValues = {
    status: string;
    paid?: number;
    datePaid?: string;
    reason?: string;
    amount?: number;
}

const OPTIONS = [
    { value: 'PAID', label: 'Paid in full', hint: 'Confirms the order and emails the customer a receipt.' },
    { value: 'PART_PAID', label: 'Part payment received', hint: 'Records an instalment; the balance is tracked in the timeline. Fully paid instalments close the transaction.' },
    { value: 'PENDING', label: 'Pending', hint: 'Back to awaiting payment.' },
    { value: 'Declined', label: 'Declined', hint: 'The customer is emailed with the reason below.' },
]

type props = {
    currentStatus?: string | null;
    currency?: string;
    /** Enquiries without a transaction need the agreed amount before a payment can be recorded */
    needsAmount?: boolean;
    onSubmit: (values: PaymentStatusValues) => Promise<{ message?: string } | undefined>;
    onDone?: () => void;
}

/** Admin form to record a payment outcome; every service uses the same server rules */
export default function PaymentStatusForm(props: props) {
    const [status, setStatus] = React.useState('')
    const [paid, setPaid] = React.useState('')
    const [datePaid, setDatePaid] = React.useState(dayjs().format('YYYY-MM-DD'))
    const [reason, setReason] = React.useState('')
    const [amount, setAmount] = React.useState('')
    const [error, setError] = React.useState('')
    const [saving, setSaving] = React.useState(false)
    const isPaid = props.currentStatus === 'PAID'

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        setError('')
        if (!status) return setError('Choose a payment status')
        if (props.needsAmount && !(Number(amount) > 0)) return setError('Enter the amount agreed with the customer')
        if (status === 'PART_PAID' && !(Number(paid) > 0)) return setError('Enter the amount received')
        setSaving(true)
        try {
            const response = await props.onSubmit({
                status,
                ...(status === 'PART_PAID' ? { paid: Number(paid), datePaid } : {}),
                ...(status === 'Declined' && reason.trim() ? { reason: reason.trim() } : {}),
                ...(props.needsAmount ? { amount: Number(amount) } : {}),
            })
            getAlert(response?.message ?? 'Payment status updated', 'success')
            props.onDone?.()
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    if (isPaid) return <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">This transaction is fully paid. Paid transactions can't be changed.</div>

    const input = 'w-full h-10 px-3 rounded-md border border-slate-300 text-sm! outline-none focus:border-primary bg-white'
    return (
        <form onSubmit={submit} className="space-y-3 text-sm">
            {props.needsAmount && (
                <label className="block">
                    <span className="block mb-1 font-medium">Agreed amount (NGN)</span>
                    <input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} className={input} />
                    <span className="block text-xs text-zinc-500 mt-1">This enquiry has no invoice yet; one is created with this amount.</span>
                </label>
            )}
            <div className="space-y-1.5">
                {OPTIONS.filter((option) => option.value !== props.currentStatus).map((option) => (
                    <label key={option.value} className={`flex items-start gap-2 rounded-md border p-2 cursor-pointer ${status === option.value ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                        <input type="radio" name="payment-status" value={option.value} checked={status === option.value} onChange={() => setStatus(option.value)} className="mt-1" />
                        <span><span className="font-medium">{option.label}</span><span className="block text-xs text-zinc-500">{option.hint}</span></span>
                    </label>
                ))}
            </div>
            {status === 'PART_PAID' && (
                <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="block mb-1 font-medium">Amount received{props.currency ? ` (${props.currency})` : ''}</span><input type="number" min="0" step="any" value={paid} onChange={(event) => setPaid(event.target.value)} className={input} /></label>
                    <label className="block"><span className="block mb-1 font-medium">Date received</span><input type="date" max={dayjs().format('YYYY-MM-DD')} value={datePaid} onChange={(event) => setDatePaid(event.target.value)} className={input} /></label>
                </div>
            )}
            {status === 'Declined' && (
                <label className="block"><span className="block mb-1 font-medium">Reason (sent to the customer)</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Transfer not received" className={input} /></label>
            )}
            {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">{error}</div>}
            <button type="submit" disabled={saving} className="w-full h-10 rounded-md bg-primary text-white font-semibold cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : 'Update payment status'}</button>
        </form>
    )
}
