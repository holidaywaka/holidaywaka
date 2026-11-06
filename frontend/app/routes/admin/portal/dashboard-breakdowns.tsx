import dayjs from 'dayjs'
import { FaCircleCheck, FaCircleExclamation, FaCircleXmark, FaClock } from 'react-icons/fa6'
import DashboardCard, { DataTable } from './dashboard-card'
import { TrendBadge } from './dashboard-kpi'
import {
    formatCount, formatNaira, formatNairaCompact, formatPercent, lineColor, lineLabel, PaymentMethodLabels,
    paymentStatusMeta, StatusTones, type StatusTone,
} from './dashboard-theme'
import type { DashboardResponse } from './dashboard-types'

export const ToneIcons: Record<StatusTone, typeof FaCircleCheck> = {
    good: FaCircleCheck,
    warning: FaClock,
    serious: FaCircleExclamation,
    critical: FaCircleXmark,
    neutral: FaClock,
}

function StatusLabel({ status }: { status: string }) {
    const meta = paymentStatusMeta(status);
    const Icon = ToneIcons[meta.tone];
    return (
        <span className="inline-flex items-center gap-1.5 text-zinc-800">
            <Icon className="size-3.5 shrink-0" style={{ color: StatusTones[meta.tone] }} aria-hidden />
            {meta.label}
        </span>
    )
}

export function LineLabel({ line }: { line: string | null }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm shrink-0" style={{ background: lineColor(line) }} aria-hidden />
            {lineLabel(line)}
        </span>
    )
}

/** Horizontal bar row: label + value text in ink colours, the bar carries identity */
export function BarRow({ label, value, share, color, swatch }: { label: React.ReactNode; value: string; share: number; color: string; swatch?: boolean }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-zinc-800 min-w-0">
                    {swatch && <span className="size-2.5 rounded-sm shrink-0" style={{ background: color }} aria-hidden />}
                    <span className="truncate">{label}</span>
                </span>
                <span className="tabular-nums text-zinc-700 shrink-0">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden" title={`${formatPercent(share)}`}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%`, background: color }} />
            </div>
        </div>
    )
}

export function PaymentStatusBreakdown({ data }: { data: DashboardResponse }) {
    const total = data.payment_status.reduce((sum, item) => sum + item.count, 0);
    const table = (
        <DataTable
            head={['Status', 'Transactions', 'Value', 'Share']}
            rows={data.payment_status.map((item) => [paymentStatusMeta(item.status).label, item.count, formatNaira(item.value), formatPercent(total ? (item.count / total) * 100 : 0)])}
        />
    )
    return (
        <DashboardCard title="Payment status" subtitle={`${formatCount(total)} transactions opened`} table={table}>
            {total === 0 ? <div className="text-sm text-zinc-500 py-6 text-center">No transactions in this period</div> : (
                <div className="space-y-4">
                    {data.payment_status.map((item) => {
                        const share = (item.count / total) * 100;
                        return (
                            <BarRow
                                key={item.status}
                                label={<StatusLabel status={item.status} />}
                                value={`${item.count} · ${formatNairaCompact(item.value)}`}
                                share={share}
                                color={StatusTones[paymentStatusMeta(item.status).tone]}
                            />
                        )
                    })}
                </div>
            )}
        </DashboardCard>
    )
}

export function PaymentMethods({ data }: { data: DashboardResponse }) {
    return (
        <DashboardCard title="How customers pay" subtitle="Share of paid revenue">
            {data.payment_methods.length === 0 ? <div className="text-sm text-zinc-500 py-6 text-center">No paid bookings in this period</div> : (
                <div className="space-y-3">
                    {data.payment_methods.map((item) => (
                        <div key={item.method} className="flex items-center justify-between gap-3 text-sm">
                            <div>
                                <div className="font-medium text-zinc-800">{PaymentMethodLabels[item.method] ?? item.method}</div>
                                <div className="text-xs text-zinc-500">{formatCount(item.count)} payments · {formatNaira(item.revenue)}</div>
                            </div>
                            <div className="text-xl font-bold tabular-nums text-zinc-900">{formatPercent(item.share)}</div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardCard>
    )
}

export function TopPackages({ data }: { data: DashboardResponse }) {
    return (
        <DashboardCard title="Top holiday packages" subtitle="By paid revenue, then enquiries">
            {data.top_packages.length === 0 ? <div className="text-sm text-zinc-500 py-6 text-center">No package enquiries in this period</div> : (
                <DataTable
                    head={['Package', 'Enquiries', 'Paid', 'Revenue', 'Margin']}
                    rows={data.top_packages.map((item) => [<span className="line-clamp-1">{item.title}</span>, item.enquiries, item.paid, formatNairaCompact(item.revenue), formatNairaCompact(item.margin)])}
                />
            )}
        </DashboardCard>
    )
}

export function HotelInventory({ data }: { data: DashboardResponse }) {
    const sync = data.hotels.last_sync;
    const syncTone: StatusTone = !sync ? 'neutral' : sync.status === 'success' ? 'good' : sync.status === 'failed' ? 'critical' : 'warning';
    const SyncIcon = ToneIcons[syncTone];
    const stats = [
        { label: 'Hotels available', value: formatCount(data.hotels.synced) },
        { label: 'Destinations', value: formatCount(data.hotels.regions) },
        { label: 'Awaiting content', value: formatCount(data.hotels.pending_content) },
    ];
    return (
        <DashboardCard title="Hotel inventory" subtitle="RateHawk content stored locally">
            <div className="grid grid-cols-3 gap-3">
                {stats.map((item) => (
                    <div key={item.label}>
                        <div className="text-xl font-bold tabular-nums text-zinc-900">{item.value}</div>
                        <div className="text-xs text-zinc-500">{item.label}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-600">Prebooks (rooms held)</span>
                    <span className="flex items-center gap-2"><span className="font-semibold tabular-nums">{data.hotels.prebooks.value}</span><TrendBadge change={data.hotels.prebooks.change} /></span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-600">Last content sync</span>
                    <span className="inline-flex items-center gap-1.5 text-zinc-800">
                        <SyncIcon className="size-3.5" style={{ color: StatusTones[syncTone] }} aria-hidden />
                        {sync ? `${sync.status} · ${dayjs(sync.startedAt).format('D MMM, h:mm A')}` : 'Never run'}
                    </span>
                </div>
            </div>
        </DashboardCard>
    )
}

export function RecentTransactions({ data }: { data: DashboardResponse }) {
    return (
        <DashboardCard title="Recent transactions" subtitle="Latest in this period">
            {data.recent_transactions.length === 0 ? <div className="text-sm text-zinc-500 py-6 text-center">No transactions in this period</div> : (
                <DataTable
                    head={['Reference', 'Business line', 'Status', 'Amount', 'Margin', 'Date']}
                    rows={data.recent_transactions.map((item) => [
                        <span className="font-mono text-xs">{item.txid}</span>,
                        <LineLabel line={item.line} />,
                        <StatusLabel status={item.status} />,
                        formatNaira(item.amount),
                        formatNairaCompact(item.margin),
                        dayjs(item.created_at).format('D MMM YYYY'),
                    ])}
                />
            )}
        </DashboardCard>
    )
}
