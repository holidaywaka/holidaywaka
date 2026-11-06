import type { ChartData, ChartOptions } from 'chart.js'
import { Bar, Chart } from 'react-chartjs-2'
import { FaArrowTrendDown, FaArrowTrendUp, FaLightbulb } from 'react-icons/fa6'
import DashboardCard, { DataTable } from '~/routes/admin/portal/dashboard-card'
import { barStyle, baseOptions, categoryAxis, valueAxis } from '~/routes/admin/portal/dashboard-chart-config'
import { EmptyChart } from '~/routes/admin/portal/dashboard-charts'
import { BarRow } from '~/routes/admin/portal/dashboard-breakdowns'
import { TrendBadge } from '~/routes/admin/portal/dashboard-kpi'
import {
    ChartInk, formatCount, formatNaira, formatNairaCompact, formatPercent, lineColor, lineLabel, MARGIN_INK, StatusTones,
} from '~/routes/admin/portal/dashboard-theme'
import type { InsightsResponse, InsightTone } from '~/routes/admin/portal/dashboard-types'

const TakeawayIcons: Record<InsightTone, { Icon: typeof FaLightbulb; color: string; label: string }> = {
    positive: { Icon: FaArrowTrendUp, color: StatusTones.good, label: 'Good news' },
    negative: { Icon: FaArrowTrendDown, color: StatusTones.critical, label: 'Needs attention' },
    info: { Icon: FaLightbulb, color: ChartInk.text, label: 'Insight' },
}

export function Takeaways({ data }: { data: InsightsResponse }) {
    return (
        <DashboardCard title="Key takeaways" subtitle={`What stands out in the ${data.range.label.toLowerCase()}`}>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
                {data.takeaways.map((item, index) => {
                    const meta = TakeawayIcons[item.tone];
                    return (
                        <li key={index} className="flex gap-2 text-sm text-zinc-800">
                            <meta.Icon className="size-4 mt-0.5 shrink-0" style={{ color: meta.color }} aria-label={meta.label} />
                            <span>{item.text}</span>
                        </li>
                    )
                })}
            </ul>
        </DashboardCard>
    )
}

/** Small multiples: one chart per business line on a shared scale, revenue bars + margin line */
export function LineTrends({ data }: { data: InsightsResponse }) {
    const { buckets, lines } = data.trends;
    const sharedMax = Math.max(1, ...lines.flatMap((line) => line.revenue));

    return (
        <section className="space-y-2" aria-labelledby="line-trends-title">
            <div>
                <h2 id="line-trends-title" className="font-semibold text-zinc-900">Revenue and margin trend by business line</h2>
                <div className="text-xs text-zinc-500">Same ₦ scale on every chart so lines compare directly. Bars: revenue · dark line: gross margin</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lines.map((line) => {
                    const hasData = line.revenue.some((value) => value > 0);
                    const options: ChartOptions<'bar' | 'line'> = {
                        ...baseOptions,
                        scales: { x: categoryAxis, y: { ...valueAxis(formatNairaCompact), suggestedMax: sharedMax } },
                        plugins: {
                            ...baseOptions.plugins,
                            legend: { display: false },
                            tooltip: { ...baseOptions.plugins.tooltip, callbacks: { label: (item) => ` ${item.dataset.label}: ${formatNaira(Number(item.raw))}` } },
                        },
                    }
                    const table = (
                        <DataTable
                            head={['Period', 'Revenue', 'Gross margin']}
                            rows={buckets.map((label, index) => [label, formatNaira(line.revenue[index]), formatNaira(line.margin[index])]).filter((_, index) => line.revenue[index] > 0)}
                        />
                    )
                    return (
                        <DashboardCard
                            key={line.line}
                            title={line.label}
                            subtitle={`${formatNairaCompact(line.total_revenue)} revenue · ${formatNairaCompact(line.total_margin)} margin (${formatPercent(line.margin_rate)})`}
                            table={table}
                            action={<span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: lineColor(line.line) }} aria-hidden /><TrendBadge change={line.revenue_change} /></span>}>
                            {!hasData ? <EmptyChart height="h-48" message="No paid bookings in this period" /> : (
                                <div className="h-48">
                                    <Chart type="bar" options={options} data={trendData(buckets, line)} />
                                </div>
                            )}
                        </DashboardCard>
                    )
                })}
            </div>
        </section>
    )
}

function trendData(buckets: string[], line: InsightsResponse['trends']['lines'][number]): ChartData<'bar' | 'line', number[], string> {
    return {
        labels: buckets,
        datasets: [
            { type: 'bar', label: 'Revenue', data: line.revenue, ...barStyle(lineColor(line.line)), order: 2 },
            // Same unit (₦) and axis as the bars, so a single scale stays honest
            { type: 'line', label: 'Gross margin', data: line.margin, borderColor: MARGIN_INK, backgroundColor: MARGIN_INK, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, order: 1 },
        ],
    }
}

export function Funnels({ data }: { data: InsightsResponse }) {
    return (
        <section className="space-y-2" aria-labelledby="funnels-title">
            <div>
                <h2 id="funnels-title" className="font-semibold text-zinc-900">Conversion funnel by business line</h2>
                <div className="text-xs text-zinc-500">From first request to fully paid; % shows how many moved on from the step before</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {data.funnels.map((funnel) => {
                    const top = Math.max(1, funnel.steps[0].count, ...funnel.steps.map((step) => step.count));
                    return (
                        <DashboardCard key={funnel.line} title={funnel.label} subtitle={`${formatPercent(funnel.overall_rate)} of requests fully paid`}>
                            <div className="space-y-3">
                                {funnel.steps.map((step) => (
                                    <BarRow
                                        key={step.label}
                                        label={step.label}
                                        value={step.rate_from_previous === null ? formatCount(step.count) : `${formatCount(step.count)} · ${formatPercent(step.rate_from_previous)}`}
                                        share={(step.count / top) * 100}
                                        color={lineColor(funnel.line)}
                                    />
                                ))}
                            </div>
                        </DashboardCard>
                    )
                })}
            </div>
        </section>
    )
}

export function LeadTime({ data }: { data: InsightsResponse }) {
    const { buckets, median_days, by_line, sample } = data.lead_time;
    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        scales: { x: categoryAxis, y: { ...valueAxis(formatCount), ticks: { ...valueAxis(formatCount).ticks, precision: 0 } } },
        plugins: { ...baseOptions.plugins, legend: { display: false } },
    }
    return (
        <DashboardCard
            title="How far ahead customers book"
            subtitle={sample ? `Median ${median_days} days between request and travel · ${formatCount(sample)} requests` : 'Days between request and travel date'}
            table={<DataTable head={['Lead time', 'Requests']} rows={buckets.map((item) => [item.label, item.count])} />}>
            {!sample ? <EmptyChart height="h-56" message="No dated requests in this period" /> : (
                <>
                    <div className="h-56">
                        <Bar options={options} data={{ labels: buckets.map((item) => item.label), datasets: [{ label: 'Requests', data: buckets.map((item) => item.count), ...barStyle(MARGIN_INK) }] }} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-zinc-600">
                        {by_line.filter((item) => item.median_days !== null).map((item) => (
                            <span key={item.line} className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-sm" style={{ background: lineColor(item.line) }} aria-hidden />
                                {lineLabel(item.line)}: median {item.median_days} days
                            </span>
                        ))}
                    </div>
                </>
            )}
        </DashboardCard>
    )
}

export function Seasonality({ data }: { data: InsightsResponse }) {
    const series = data.seasonality.series.filter((item) => item.values.some((value) => value > 0));
    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        scales: { x: { ...categoryAxis, stacked: true }, y: { ...valueAxis(formatCount), stacked: true, ticks: { ...valueAxis(formatCount).ticks, precision: 0 } } },
        plugins: { ...baseOptions.plugins, legend: { ...baseOptions.plugins.legend, display: series.length > 1 }, tooltip: { ...baseOptions.plugins.tooltip, filter: (item) => Number(item.raw) > 0 } },
    }
    return (
        <DashboardCard
            title="When customers want to travel"
            subtitle="Requests by month of travel"
            table={<DataTable head={['Month', ...series.map((item) => lineLabel(item.line))]} rows={data.seasonality.months.map((month, index) => [month, ...series.map((item) => item.values[index])])} />}>
            {series.length === 0 ? <EmptyChart height="h-56" message="No dated requests in this period" /> : (
                <div className="h-56">
                    <Bar options={options} data={{ labels: data.seasonality.months, datasets: series.map((item) => ({ label: lineLabel(item.line), data: item.values, ...barStyle(lineColor(item.line)) })) }} />
                </div>
            )}
        </DashboardCard>
    )
}

export function RequestWeekdays({ data }: { data: InsightsResponse }) {
    const total = data.request_weekdays.reduce((sum, item) => sum + item.count, 0);
    const busiest = [...data.request_weekdays].sort((a, b) => b.count - a.count)[0];
    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        scales: { x: categoryAxis, y: { ...valueAxis(formatCount), ticks: { ...valueAxis(formatCount).ticks, precision: 0 } } },
        plugins: { ...baseOptions.plugins, legend: { display: false } },
    }
    return (
        <DashboardCard
            title="When customers enquire"
            subtitle={total ? `Busiest day: ${busiest.label} (${formatPercent((busiest.count / total) * 100)} of requests)` : 'Requests by day of week'}
            table={<DataTable head={['Day', 'Requests']} rows={data.request_weekdays.map((item) => [item.label, item.count])} />}>
            {!total ? <EmptyChart height="h-56" message="No requests in this period" /> : (
                <div className="h-56">
                    <Bar options={options} data={{ labels: data.request_weekdays.map((item) => item.label), datasets: [{ label: 'Requests', data: data.request_weekdays.map((item) => item.count), ...barStyle(MARGIN_INK) }] }} />
                </div>
            )}
        </DashboardCard>
    )
}

const DESTINATION_GROUPS = [
    { key: 'packages', line: 'packages', title: 'Holiday package destinations', unit: 'enquiries' },
    { key: 'visa', line: 'visa', title: 'Visa destinations', unit: 'applications' },
    { key: 'hotels', line: 'hotels', title: 'Hotel destinations', unit: 'prebooks' },
] as const;

export function Destinations({ data }: { data: InsightsResponse }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {DESTINATION_GROUPS.map((group) => {
                const items = data.destinations[group.key];
                const max = Math.max(1, ...items.map((item) => item.requests));
                return (
                    <DashboardCard
                        key={group.key}
                        title={group.title}
                        subtitle={`Ranked by paid revenue, then ${group.unit}`}
                        table={items.length ? <DataTable head={['Destination', group.unit, 'Revenue']} rows={items.map((item) => [item.name, item.requests, formatNaira(item.revenue)])} /> : undefined}>
                        {items.length === 0 ? <div className="text-sm text-zinc-500 py-6 text-center">No {group.unit} in this period</div> : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <BarRow
                                        key={item.name}
                                        label={item.name}
                                        value={`${item.requests} ${group.unit}${item.revenue ? ` · ${formatNairaCompact(item.revenue)}` : ''}`}
                                        share={(item.requests / max) * 100}
                                        color={lineColor(group.line)}
                                    />
                                ))}
                            </div>
                        )}
                    </DashboardCard>
                )
            })}
        </div>
    )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div>
            <div className="text-xl font-bold tabular-nums text-zinc-900">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
            {hint && <div className="text-xs text-zinc-400">{hint}</div>}
        </div>
    )
}

export function Customers({ data }: { data: InsightsResponse }) {
    const customers = data.customers;
    return (
        <DashboardCard title="Customers" subtitle="Package and visa customers, identified by email">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <Stat label="Unique customers" value={formatCount(customers.unique_customers)} />
                <Stat label="Paying customers" value={formatCount(customers.paying_customers)} />
                <Stat label="Repeat rate" value={formatPercent(customers.repeat_rate)} hint={`${customers.repeat_customers} came back`} />
                <Stat label="Avg spend per paying customer" value={formatNairaCompact(customers.average_spend)} />
                <Stat label="Avg travellers per package" value={customers.average_group_size === null ? '-' : String(customers.average_group_size)} />
                <Stat label="Private vs group packages" value={customers.trip_types.map((item) => formatPercent(item.share)).join(' / ') || '-'} hint={customers.trip_types.map((item) => item.type.toLowerCase()).join(' / ')} />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-sm font-semibold text-zinc-900 mb-1">Top customers by spend</div>
                {customers.top_customers.length === 0 ? <div className="text-sm text-zinc-500 py-4">No paying customers in this period</div> : (
                    <div className="overflow-x-auto">
                        <DataTable
                            head={['Customer', 'Requests', 'Paid bookings', 'Spend', 'Margin']}
                            rows={customers.top_customers.map((item) => [
                                <div><div className="text-zinc-900">{item.name || item.email}</div><div className="text-xs text-zinc-500">{item.email}</div></div>,
                                item.requests, item.paid_bookings, formatNaira(item.spend), formatNairaCompact(item.margin),
                            ])}
                        />
                    </div>
                )}
            </div>
        </DashboardCard>
    )
}

export function HotelDemand({ data }: { data: InsightsResponse }) {
    const hotels = data.hotels;
    return (
        <DashboardCard title="Hotel demand" subtitle={hotels.hotel_bookings ? 'Prebooks and bookings' : 'Prebooks show demand until online hotel booking goes live'}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Rooms prebooked" value={formatCount(hotels.prebooks)} />
                <Stat label="Value of prebooks" value={formatNairaCompact(hotels.prebook_value)} hint={`avg ${formatNairaCompact(hotels.average_prebook_value)}`} />
                <Stat label="Avg nights per stay" value={hotels.average_nights === null ? '-' : String(hotels.average_nights)} />
                <Stat label="Price changed at prebook" value={formatPercent(hotels.price_change_rate)} hint="Supplier repriced before booking" />
            </div>
        </DashboardCard>
    )
}
