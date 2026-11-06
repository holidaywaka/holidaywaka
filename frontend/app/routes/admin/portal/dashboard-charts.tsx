import React from 'react'
import type { ChartOptions } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import DashboardCard, { DataTable } from './dashboard-card'
import { barStyle, baseOptions, categoryAxis, valueAxis } from './dashboard-chart-config'
import { formatCount, formatNaira, formatNairaCompact, lineColor, lineLabel } from './dashboard-theme'
import type { DashboardResponse } from './dashboard-types'

type Metric = 'revenue' | 'margin';

export function MetricToggle({ value, onChange }: { value: Metric; onChange: (value: Metric) => void }) {
    return (
        <div className="flex text-xs border border-slate-200 rounded-md overflow-hidden" role="tablist" aria-label="Measure">
            {(['revenue', 'margin'] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={value === option}
                    onClick={() => onChange(option)}
                    className={`px-2 py-1 capitalize cursor-pointer ${value === option ? 'bg-primary text-white font-semibold' : 'text-zinc-500'}`}>
                    {option}
                </button>
            ))}
        </div>
    )
}

export function RevenueChart({ data, className }: { data: DashboardResponse; className?: string }) {
    const [metric, setMetric] = React.useState<Metric>('revenue');
    // Lines with nothing in the range are left out; the rest keep their fixed colours
    const series = data.revenue_series.series.filter((item) => item[metric].some((value) => value > 0));
    const buckets = data.revenue_series.buckets;
    const metricLabel = metric === 'revenue' ? 'Revenue' : 'Gross margin';

    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        scales: { x: { ...categoryAxis, stacked: true }, y: { ...valueAxis(formatNairaCompact), stacked: true } },
        plugins: {
            ...baseOptions.plugins,
            legend: { ...baseOptions.plugins.legend, display: series.length > 1 },
            tooltip: {
                ...baseOptions.plugins.tooltip,
                filter: (item) => Number(item.raw) > 0,
                callbacks: {
                    label: (item) => ` ${item.dataset.label}: ${formatNaira(Number(item.raw))}`,
                    footer: (items) => `${metricLabel}: ${formatNaira(items.reduce((sum, item) => sum + Number(item.raw), 0))}`,
                },
            },
        },
    }

    const table = (
        <DataTable
            head={['Period', ...series.map((item) => lineLabel(item.line)), 'Total']}
            rows={buckets
                .map((label, index) => [label, ...series.map((item) => formatNaira(item[metric][index])), formatNaira(series.reduce((sum, item) => sum + item[metric][index], 0))])
                .filter((_, index) => series.some((item) => item[metric][index] > 0))}
        />
    )

    return (
        <DashboardCard
            className={className}
            title={`${metricLabel} by business line`}
            subtitle={`Paid bookings, ${data.range.label.toLowerCase()}, by ${data.range.bucket}`}
            table={table}
            action={<MetricToggle value={metric} onChange={setMetric} />}>
            {series.length === 0 ? (
                <EmptyChart message="No paid bookings in this period" />
            ) : (
                <div className="h-72">
                    <Bar
                        options={options}
                        data={{
                            labels: buckets,
                            datasets: series.map((item) => ({ label: lineLabel(item.line), data: item[metric], ...barStyle(lineColor(item.line)) })),
                        }}
                    />
                </div>
            )}
        </DashboardCard>
    )
}

const CREATED_COLOR = '#8a8985';
const PAID_COLOR = '#002722';

export function BookingsChart({ data, className }: { data: DashboardResponse; className?: string }) {
    const { buckets, created, paid } = data.bookings_series;
    const hasData = created.some((value) => value > 0);

    const options: ChartOptions<'line'> = {
        ...baseOptions,
        scales: { x: categoryAxis, y: { ...valueAxis(formatCount), ticks: { ...valueAxis(formatCount).ticks, precision: 0 } } },
        elements: { line: { borderWidth: 2, tension: 0.25 }, point: { radius: 0, hoverRadius: 4, hitRadius: 12 } },
    }

    const table = (
        <DataTable
            head={['Period', 'Bookings created', 'Paid', 'Conversion']}
            rows={buckets
                .map((label, index) => [label, created[index], paid[index], created[index] ? `${Math.round((paid[index] / created[index]) * 100)}%` : '-'])
                .filter((_, index) => created[index] > 0)}
        />
    )

    return (
        <DashboardCard className={className} title="Bookings created vs paid" subtitle="Transactions opened and those fully paid" table={table}>
            {!hasData ? (
                <EmptyChart message="No bookings in this period" />
            ) : (
                <div className="h-72">
                    <Line
                        options={options}
                        data={{
                            labels: buckets,
                            datasets: [
                                { label: 'Created', data: created, borderColor: CREATED_COLOR, backgroundColor: CREATED_COLOR, borderDash: [4, 4] },
                                { label: 'Paid', data: paid, borderColor: PAID_COLOR, backgroundColor: PAID_COLOR },
                            ],
                        }}
                    />
                </div>
            )}
        </DashboardCard>
    )
}

export function EmptyChart({ message, height = 'h-72' }: { message: string; height?: string }) {
    return <div className={`${height} flex items-center justify-center text-sm text-zinc-500 bg-slate-50 rounded-md`}>{message}</div>
}
