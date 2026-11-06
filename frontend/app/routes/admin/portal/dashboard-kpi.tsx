import { FaArrowDown, FaArrowUp, FaMinus } from 'react-icons/fa6'
import { StatusTones } from './dashboard-theme'
import type { DashboardKpi } from './dashboard-types'

type props = {
    label: string;
    value: string;
    kpi: DashboardKpi;
    rangeLabel: string;
    hint?: string;
    /** For metrics where an increase is not good news (e.g. outstanding payments) */
    neutralTrend?: boolean;
}

export function TrendBadge({ change, neutralTrend }: { change: number | null; neutralTrend?: boolean }) {
    if (change === null) return <span className="text-xs text-zinc-500">No prior data</span>;
    const up = change > 0;
    const flat = change === 0;
    const Icon = flat ? FaMinus : up ? FaArrowUp : FaArrowDown;
    const color = flat || neutralTrend ? '#52514e' : up ? StatusTones.good : StatusTones.critical;
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color }}>
            <Icon className="size-3" aria-hidden />
            {up ? '+' : ''}{change.toLocaleString('en-NG', { maximumFractionDigits: 1 })}%
        </span>
    )
}

export default function KpiTile(props: props) {
    return (
        <div className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{props.label}</div>
            <div className="text-2xl font-bold text-zinc-900 tabular-nums">{props.value}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <TrendBadge change={props.kpi.change} neutralTrend={props.neutralTrend} />
                <span className="text-xs text-zinc-500">vs previous {props.rangeLabel.replace('Last ', '')}</span>
            </div>
            {props.hint && <div className="text-xs text-zinc-500">{props.hint}</div>}
        </div>
    )
}
