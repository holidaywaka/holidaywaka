import { TrendBadge } from './dashboard-kpi'
import { formatCount, formatNaira, formatNairaCompact, formatPercent, lineColor, LineRequestLabels } from './dashboard-theme'
import type { BusinessLineMetrics, DashboardResponse } from './dashboard-types'

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="text-sm font-semibold tabular-nums text-zinc-900">{value}</div>
        </div>
    )
}

function BusinessLineCard({ line, rangeLabel }: { line: BusinessLineMetrics; rangeLabel: string }) {
    const color = lineColor(line.key);
    const isHotels = line.key === 'hotels';
    const hasActivity = line.revenue.value > 0 || line.awaiting.count > 0 || line.requests > 0;
    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="h-1" style={{ background: color }} aria-hidden />
            <div className="p-4 flex flex-col gap-3 grow">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden />
                        <h3 className="font-semibold text-zinc-900">{line.label}</h3>
                    </div>
                    <span className="text-xs text-zinc-500 text-right">{formatPercent(line.revenue_share)} of revenue</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Revenue</div>
                        <div className="text-xl font-bold tabular-nums text-zinc-900" title={formatNaira(line.revenue.value)}>{formatNairaCompact(line.revenue.value)}</div>
                        <TrendBadge change={line.revenue.change} />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Gross margin</div>
                        <div className="text-xl font-bold tabular-nums text-zinc-900" title={formatNaira(line.margin.value)}>{formatNairaCompact(line.margin.value)}</div>
                        <div className="text-xs text-zinc-600">
                            {formatPercent(line.margin_rate)} of sales{line.margin_estimated && <span className="ml-1 text-zinc-500" title="Some bookings predate markup recording; their margin uses the current markup">· est.</span>}
                        </div>
                    </div>
                </div>

                {/* Share of total margin: how much this line actually contributes to profit */}
                <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Share of total margin</span>
                        <span className="tabular-nums text-zinc-700">{formatPercent(line.margin_share)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${line.margin_share > 0 ? Math.max(line.margin_share, 2) : 0}%`, background: color }} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-3 border-t border-slate-100">
                    <Stat label="Paid bookings" value={formatCount(line.paid_bookings.value)} />
                    <Stat label="Avg booking" value={formatNairaCompact(line.average_booking_value)} />
                    <Stat label="Awaiting payment" value={`${formatNairaCompact(line.awaiting.value)} (${line.awaiting.count})`} />
                    <Stat label="Payment conversion" value={formatPercent(line.conversion_rate)} />
                </div>

                <div className="mt-auto pt-2 text-xs text-zinc-500 flex flex-wrap justify-between gap-1">
                    <span>{formatCount(line.requests)} {LineRequestLabels[line.key]} · {rangeLabel.toLowerCase()}</span>
                    <span>Markup {formatPercent(line.current_markup.value)} + VAT {formatPercent(line.current_markup.vat)}</span>
                </div>
                {isHotels && line.paid_bookings.value === 0 && hasActivity && (
                    <div className="text-xs text-zinc-500 bg-slate-50 rounded-md p-2">Hotel revenue starts once online hotel booking goes live; prebooks show demand.</div>
                )}
            </div>
        </div>
    )
}

export default function BusinessLines({ data }: { data: DashboardResponse }) {
    return (
        <section aria-labelledby="business-lines-title" className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 id="business-lines-title" className="font-semibold text-zinc-900">Revenue and margin by business line</h2>
                    <div className="text-xs text-zinc-500">Gross margin is our markup on paid bookings, VAT excluded</div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {data.business_lines.map((line) => <BusinessLineCard key={line.key} line={line} rangeLabel={data.range.label} />)}
            </div>
        </section>
    )
}
