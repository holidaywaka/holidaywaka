import React from 'react'
import dayjs from 'dayjs'
import { Drawer, Modal } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import { drawerStyle, modalStyle } from '~/components/utils'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'

export function meta() {
    return [{ title: 'Vouchers' }]
}

type Voucher = {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    expirationDate: string;
    maxUsageCount: number;
    currentUsageCount: number;
    service: string;
    status: string;
    accountId: string | null;
    createdAt: string;
}

type VoucherLog = {
    id: string;
    email: string;
    status: string;
    discountedValue: number;
    priceCharge: number;
    createdAt: string;
    transaction: { id: string; txid: string; txType: string; paymentStatus: string; charge: { currency?: string } } | null;
}

const SERVICES: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All services' },
    { value: 'HOTEL', label: 'Hotels' },
    { value: 'TRIP', label: 'Holiday packages' },
    { value: 'VISA', label: 'Visa' },
    { value: 'TRANSFER', label: 'Airport transfers' },
    { value: 'CHAUFFEUR', label: 'Chauffeur' },
]
const serviceLabel = (value: string) => SERVICES.find((item) => item.value === value)?.label ?? value
const discountText = (voucher: Pick<Voucher, 'discountType' | 'discountValue'>) =>
    String(voucher.discountType).toUpperCase() === 'PERCENTAGE' ? `${voucher.discountValue}% off` : `NGN ${Number(voucher.discountValue).toLocaleString()} off`

function voucherState(voucher: Voucher) {
    if (voucher.status !== 'true') return { label: 'Inactive', className: 'bg-slate-100 text-zinc-600 border-slate-200' }
    if (dayjs(voucher.expirationDate).isBefore(dayjs())) return { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200' }
    if (voucher.maxUsageCount > 0 && voucher.currentUsageCount >= voucher.maxUsageCount) return { label: 'Used up', className: 'bg-amber-50 text-amber-800 border-amber-200' }
    return { label: 'Active', className: 'bg-green-50 text-green-800 border-green-200' }
}

export default function Vouchers() {
    const queryClient = useQueryClient()
    const [editing, setEditing] = React.useState<Voucher | 'new' | null>(null)
    const [logsFor, setLogsFor] = React.useState<Voucher | null>(null)
    const { data, isLoading } = useQuery<{ data: Voucher[]; total: number }>({
        queryKey: ['admin-vouchers'],
        queryFn: () => createResponse({ endpoint: `${NewApis.voucher.all}?page_size=100` }),
    })
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] })
    const remove = useMutation({
        mutationFn: (id: string) => createResponse({ endpoint: NewApis.voucher.delete(id), method: 'DELETE' }),
        onSuccess: () => { getAlert('Voucher deleted', 'success'); refresh() },
        onError: (error) => getAlert((error as Error).message, 'error'),
    })
    const toggle = useMutation({
        mutationFn: (voucher: Voucher) => createResponse({ endpoint: `${NewApis.voucher.update}/${voucher.id}`, method: 'PUT', data: { status: voucher.status === 'true' ? 'false' : 'true' } }),
        onSuccess: () => refresh(),
        onError: (error) => getAlert((error as Error).message, 'error'),
    })

    return (
        <div>
            <Modal opened={editing !== null} onClose={() => setEditing(null)} withCloseButton={false} styles={modalStyle} centered size="lg">
                {editing !== null && <VoucherForm voucher={editing === 'new' ? null : editing} onDone={() => { setEditing(null); refresh() }} onCancel={() => setEditing(null)} />}
            </Modal>
            <Drawer opened={logsFor !== null} onClose={() => setLogsFor(null)} title={logsFor ? `Usage of ${logsFor.code}` : ''} styles={drawerStyle} position="right" size="lg">
                {logsFor && <VoucherLogs voucher={logsFor} />}
            </Drawer>
            <AHeader title="Vouchers" subtitle="Discount codes customers can apply at checkout" />
            <div className="w-[96%] mx-auto space-y-3 pb-10">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <NavLinks options={["home", "vouchers"]} header="Total vouchers" total={data?.total ?? 0} />
                    <button type="button" onClick={() => setEditing('new')} className="h-10 px-4 rounded-md bg-primary text-white font-semibold text-sm cursor-pointer">New voucher</button>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                            <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Applies to</th><th className="p-3">Usage</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && <tr><td colSpan={7} className="p-3"><Skeleton count={4} height={20} /></td></tr>}
                            {!isLoading && !data?.data.length && <tr><td colSpan={7} className="p-10 text-center text-zinc-500">No vouchers yet. Create one to offer discounts at checkout.</td></tr>}
                            {data?.data.map((voucher) => {
                                const state = voucherState(voucher)
                                return (
                                    <tr key={voucher.id}>
                                        <td className="p-3 font-mono font-semibold">{voucher.code}</td>
                                        <td className="p-3">{discountText(voucher)}</td>
                                        <td className="p-3">{serviceLabel(voucher.service)}</td>
                                        <td className="p-3 tabular-nums">{voucher.currentUsageCount ?? 0} / {voucher.maxUsageCount > 0 ? voucher.maxUsageCount : '∞'}</td>
                                        <td className="p-3 whitespace-nowrap">{dayjs(voucher.expirationDate).format('D MMM YYYY')}</td>
                                        <td className="p-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${state.className}`}>{state.label}</span></td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-1">
                                                <button type="button" onClick={() => setLogsFor(voucher)} className="h-8 px-2 rounded-md border border-slate-300 text-xs cursor-pointer">Usage</button>
                                                <button type="button" onClick={() => setEditing(voucher)} className="h-8 px-2 rounded-md border border-slate-300 text-xs cursor-pointer">Edit</button>
                                                <button type="button" onClick={() => toggle.mutate(voucher)} className="h-8 px-2 rounded-md border border-slate-300 text-xs cursor-pointer">{voucher.status === 'true' ? 'Deactivate' : 'Activate'}</button>
                                                <button type="button" onClick={() => { if (window.confirm(`Delete voucher ${voucher.code}? Past orders keep their discount.`)) remove.mutate(voucher.id) }} className="h-8 px-2 rounded-md border border-red-200 text-red-700 text-xs cursor-pointer">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function VoucherForm({ voucher, onDone, onCancel }: { voucher: Voucher | null; onDone: () => void; onCancel: () => void }) {
    const [values, setValues] = React.useState({
        code: voucher?.code ?? '',
        discountType: voucher?.discountType ?? 'PERCENTAGE',
        discountValue: voucher ? String(voucher.discountValue) : '',
        service: voucher?.service ?? 'ALL',
        maxUsageCount: voucher ? String(voucher.maxUsageCount) : '100',
        expirationDate: voucher ? dayjs(voucher.expirationDate).format('YYYY-MM-DD') : dayjs().add(30, 'day').format('YYYY-MM-DD'),
        account: '',
    })
    const [error, setError] = React.useState('')
    const save = useMutation({
        mutationFn: () => createResponse({
            endpoint: voucher ? `${NewApis.voucher.update}/${voucher.id}` : NewApis.voucher.create,
            method: voucher ? 'PUT' : 'POST',
            data: {
                ...(voucher ? {} : { code: values.code.trim().toUpperCase() }),
                discountType: values.discountType,
                discountValue: Number(values.discountValue),
                service: values.service,
                maxUsageCount: Number(values.maxUsageCount),
                expirationDate: dayjs(values.expirationDate).endOf('day').toISOString(),
                ...(values.account.trim() ? { account: values.account.trim() } : {}),
            },
        }),
        onSuccess: () => { getAlert(voucher ? 'Voucher updated' : 'Voucher created', 'success'); onDone() },
        onError: (err) => setError((err as Error).message),
    })
    const input = 'w-full h-10 px-3 rounded-md border border-slate-300 text-sm! outline-none focus:border-primary bg-white'
    const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues({ ...values, [key]: event.target.value })

    return (
        <form onSubmit={(event) => { event.preventDefault(); setError(''); save.mutate() }} className="p-4 space-y-3 text-sm">
            <div className="text-lg font-bold">{voucher ? `Edit ${voucher.code}` : 'New voucher'}</div>
            {!voucher && <label className="block"><span className="block mb-1 font-medium">Code</span><input required value={values.code} onChange={(event) => setValues({ ...values, code: event.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="e.g. SUMMER25" className={`${input} font-mono uppercase`} /></label>}
            <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="block mb-1 font-medium">Discount type</span>
                    <select value={values.discountType} onChange={set('discountType')} className={input}><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed amount (NGN)</option></select>
                </label>
                <label className="block"><span className="block mb-1 font-medium">{values.discountType === 'PERCENTAGE' ? 'Percent off' : 'Amount off (NGN)'}</span>
                    <input required type="number" min="0" step="any" max={values.discountType === 'PERCENTAGE' ? 100 : undefined} value={values.discountValue} onChange={set('discountValue')} className={input} />
                </label>
                <label className="block"><span className="block mb-1 font-medium">Applies to</span>
                    <select value={values.service} onChange={set('service')} className={input}>{SERVICES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                </label>
                <label className="block"><span className="block mb-1 font-medium">Max uses (0 = unlimited)</span>
                    <input required type="number" min="0" value={values.maxUsageCount} onChange={set('maxUsageCount')} className={input} />
                </label>
                <label className="block"><span className="block mb-1 font-medium">Expires on</span>
                    <input required type="date" min={dayjs().format('YYYY-MM-DD')} value={values.expirationDate} onChange={set('expirationDate')} className={input} />
                </label>
                <label className="block"><span className="block mb-1 font-medium">Linked account (optional)</span>
                    <input type="email" value={values.account} onChange={set('account')} placeholder={voucher?.accountId ?? 'customer email'} className={input} />
                </label>
            </div>
            <p className="text-xs text-zinc-500">Fixed discounts are converted for customers paying in USD. A discount never exceeds the order total.</p>
            {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">{error}</div>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="h-10 px-4 rounded-md border border-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={save.isPending} className="h-10 px-4 rounded-md bg-primary text-white font-semibold cursor-pointer disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save voucher'}</button>
            </div>
        </form>
    )
}

function VoucherLogs({ voucher }: { voucher: Voucher }) {
    const { data, isLoading } = useQuery<{ data: VoucherLog[] }>({
        queryKey: ['admin-voucher-logs', voucher.id],
        queryFn: () => createResponse({ endpoint: NewApis.voucher.logs(voucher.id) }),
    })
    if (isLoading) return <div className="p-4"><Skeleton count={5} height={24} /></div>
    if (!data?.data.length) return <div className="p-6 text-sm text-zinc-500 text-center">This code hasn't been used yet.</div>
    return (
        <div className="p-4 space-y-2 text-sm">
            {data.data.map((log) => (
                <div key={log.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex justify-between gap-2"><span className="font-medium">{log.email}</span><span className="text-xs text-zinc-500">{dayjs(log.createdAt).format('D MMM YYYY, HH:mm')}</span></div>
                    <div className="text-zinc-600">Saved {Number(log.discountedValue).toLocaleString()} on {Number(log.priceCharge).toLocaleString()} {log.transaction?.charge?.currency ?? ''}</div>
                    <div className="text-xs text-zinc-500">Usage {log.status}{log.transaction ? ` · ${log.transaction.txType} ${log.transaction.txid} · payment ${log.transaction.paymentStatus}` : ''}</div>
                </div>
            ))}
        </div>
    )
}
