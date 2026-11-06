import {
    BarController,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js'
import { ChartInk } from './dashboard-theme'

ChartJS.register(BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

/** Shared Chart.js defaults: recessive grid, legend on top, dark tooltip, index hover */
export const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
        legend: {
            position: 'top' as const,
            align: 'start' as const,
            labels: { color: ChartInk.text, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded' as const, font: { size: 12 } },
        },
        tooltip: {
            backgroundColor: '#1a1a19',
            titleColor: '#f0efec',
            bodyColor: '#f0efec',
            footerColor: '#f0efec',
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
        },
    },
}

export const valueAxis = (format: (value: number) => string) => ({
    grid: { color: ChartInk.grid },
    border: { display: false },
    ticks: { color: ChartInk.muted, callback: (value: string | number) => format(Number(value)), maxTicksLimit: 6 },
    beginAtZero: true,
})

export const categoryAxis = {
    grid: { display: false },
    border: { color: ChartInk.grid },
    ticks: { color: ChartInk.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
}

/** Bar styling per the mark spec: rounded data end, 2px surface gap between stacked segments */
export const barStyle = (color: string) => ({
    backgroundColor: color,
    borderColor: ChartInk.surface,
    borderWidth: { top: 2, bottom: 0, left: 0, right: 0 },
    borderRadius: 4,
    borderSkipped: 'start' as const,
    maxBarThickness: 28,
})
