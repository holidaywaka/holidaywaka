import React from 'react'

type props = {
    title: string;
    subtitle?: string;
    /** Same data as a table: the accessible / exact-value alternative to the chart */
    table?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function DashboardCard(props: props) {
    const [view, setView] = React.useState<'chart' | 'table'>('chart');
    return (
        <section className={`bg-white p-4 rounded-lg border border-slate-200 ${props.className ?? ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                    <h2 className="font-semibold text-zinc-900">{props.title}</h2>
                    {props.subtitle && <div className="text-xs text-zinc-500">{props.subtitle}</div>}
                </div>
                <div className="flex items-center gap-2">
                    {props.action}
                    {props.table && (
                        <div className="flex text-xs border border-slate-200 rounded-md overflow-hidden" role="tablist">
                            {(['chart', 'table'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    role="tab"
                                    aria-selected={view === option}
                                    onClick={() => setView(option)}
                                    className={`px-2 py-1 capitalize cursor-pointer ${view === option ? 'bg-slate-100 font-semibold text-zinc-900' : 'text-zinc-500'}`}>
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {view === 'table' && props.table ? <div className="overflow-x-auto">{props.table}</div> : props.children}
        </section>
    )
}

export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-slate-200">
                    {head.map((cell, index) => <th key={index} className={`py-2 pr-3 font-medium ${index > 0 ? 'text-right' : ''}`}>{cell}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
                        {row.map((cell, index) => <td key={index} className={`py-2 pr-3 ${index > 0 ? 'text-right tabular-nums' : ''}`}>{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
