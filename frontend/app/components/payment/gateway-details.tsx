type GatewayRecord = Record<string, unknown> & { data?: Record<string, unknown> }

/** Rows from the gateway's status record: Unified Payment requires them on receipts and in the admin log */
export function gatewayRows(record: unknown): { label: string; value: string }[] {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return []
    const source = record as GatewayRecord
    const data = (source.data && typeof source.data === 'object' ? source.data : source) as Record<string, unknown>
    const text = (value: unknown) => (value === null || value === undefined || value === '' ? null : String(value))
    return [
        { label: 'Gateway order id', value: text(data['Order Id'] ?? data.transaction_id) },
        { label: 'Amount', value: text(data.Amount ?? data.amount) },
        { label: 'Card', value: [text(data.Scheme), text(data.PAN)].filter(Boolean).join(' ') || null },
        { label: 'Card holder', value: text(data['Card Holder']) },
        { label: 'Approval code', value: text(data['Approval Code']) },
        { label: 'Bank reference (RRN)', value: text(data.RRN) },
        { label: '3-D Secure', value: text(data.ThreeDSVerification) },
        { label: 'Status', value: text(data.StatusDescription ?? data.Status ?? data.transaction_status) },
        { label: 'Processed at', value: text(data.TranDateTime ?? source.created_at) },
    ].filter((row): row is { label: string; value: string } => Boolean(row.value))
}

export default function GatewayDetails({ record, title = 'Unified Payment details' }: { record: unknown; title?: string }) {
    const rows = gatewayRows(record)
    if (!rows.length) return null
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-left">
            <div className="font-semibold text-zinc-900 mb-1">{title}</div>
            {rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-1 border-b border-slate-100 last:border-0">
                    <span className="text-zinc-500">{row.label}</span>
                    <span className="font-medium text-zinc-900 text-right break-all">{row.value}</span>
                </div>
            ))}
        </div>
    )
}
