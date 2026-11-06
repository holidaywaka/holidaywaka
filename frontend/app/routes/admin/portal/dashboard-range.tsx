import type { DashboardRange } from './dashboard-types'

const RangeLabels: Record<DashboardRange, string> = { '7d': '7D', '30d': '30D', '90d': '90D', '12m': '12M' }

type props = {
    value: DashboardRange;
    onChange: (value: DashboardRange) => void;
    options?: DashboardRange[];
}

export default function RangeTabs({ value, onChange, options = ['7d', '30d', '90d', '12m'] }: props) {
    return (
        <div className="flex bg-white border border-slate-200 rounded-lg p-1" role="tablist" aria-label="Reporting period">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={value === option}
                    onClick={() => onChange(option)}
                    className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-all ${value === option ? 'bg-primary text-white font-semibold' : 'text-zinc-600 hover:bg-slate-100'}`}>
                    {RangeLabels[option]}
                </button>
            ))}
        </div>
    )
}
