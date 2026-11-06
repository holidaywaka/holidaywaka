import React from "react"
import dayjs from "dayjs"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"
import PortalPackage from "./dashboard-packages"
import PortalNotify from "./dashboard-notifications"
import AHeader from "~/components/admin/AHeader"
import Formbutton from "~/components/general/Formbutton"
import { createResponse, NewApis } from "~/services/new-apis"
import KpiTile from "./dashboard-kpi"
import { BookingsChart, RevenueChart } from "./dashboard-charts"
import { HotelInventory, PaymentMethods, PaymentStatusBreakdown, RecentTransactions, TopPackages } from "./dashboard-breakdowns"
import BusinessLines from "./dashboard-business-lines"
import RangeTabs from "./dashboard-range"
import { formatCount, formatNaira, formatNairaCompact, formatPercent } from "./dashboard-theme"
import type { DashboardRange, DashboardResponse } from "./dashboard-types"

export default function AdminHomePortal() {
    const [range, setRange] = React.useState<DashboardRange>('30d')

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery<DashboardResponse>({
        queryKey: ['admin-dashboard', range],
        queryFn: () => createResponse({ endpoint: `${NewApis.dashboard.dashboard}?range=${range}` }),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    })

    const kpis = data?.kpis
    const rangeLabel = data?.range.label ?? ''

    return (
        <>
        <AHeader
        title="Dashboard"
        subtitle="Welcome to your admin control panel"
        />
        <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-bold text-2xl lg:text-3xl text-zinc-900">Business overview</h1>
                    <div className="text-sm text-zinc-500">
                        {data ? `${dayjs(data.range.start).format('D MMM YYYY')} – ${dayjs(data.range.end).format('D MMM YYYY')} · amounts in Naira` : 'Loading metrics...'}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isFetching && !isLoading && <span className="text-xs text-zinc-500">Updating...</span>}
                    <RangeTabs value={range} onChange={setRange} />
                </div>
            </div>

            {isError && !data && (
                <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-sm space-y-3">
                    <div className="text-red-600">{(error as Error)?.message || 'Unable to load dashboard metrics'}</div>
                    <div className="w-fit mx-auto"><Formbutton title="Try again" type="button" onClick={() => refetch()} /></div>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{new Array(8).fill(0).map((_, index) => <Skeleton key={index} height={112} borderRadius={8} />)}</div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3"><div className="lg:col-span-2"><Skeleton height={340} borderRadius={8} /></div><Skeleton height={340} borderRadius={8} /></div>
                </div>
            )}

            {data && kpis && (
                <div className={`space-y-4 ${isFetching ? 'opacity-70' : ''} transition-opacity`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <KpiTile label="Revenue" value={formatNairaCompact(kpis.revenue.value)} kpi={kpis.revenue} rangeLabel={rangeLabel} hint={formatNaira(kpis.revenue.value)} />
                        <KpiTile label="Paid bookings" value={formatCount(kpis.paid_bookings.value)} kpi={kpis.paid_bookings} rangeLabel={rangeLabel} />
                        <KpiTile label="Average booking value" value={formatNairaCompact(kpis.average_booking_value.value)} kpi={kpis.average_booking_value} rangeLabel={rangeLabel} />
                        <KpiTile label="Payment conversion" value={formatPercent(kpis.conversion_rate.value)} kpi={kpis.conversion_rate} rangeLabel={rangeLabel} hint="Paid out of all transactions opened" />
                        <KpiTile label="Awaiting payment" value={formatNairaCompact(kpis.awaiting_payment.value)} kpi={kpis.awaiting_payment} rangeLabel={rangeLabel} neutralTrend hint={`${formatCount(kpis.awaiting_payment.count)} pending, submitted or part-paid`} />
                        <KpiTile label="Gross margin" value={formatNairaCompact(kpis.gross_margin.value)} kpi={kpis.gross_margin} rangeLabel={rangeLabel} hint={`${formatPercent(kpis.gross_margin.rate)} of revenue${kpis.gross_margin.estimated ? ' · partly estimated from current markups' : ''}`} />
                        <KpiTile label="New enquiries" value={formatCount(kpis.new_enquiries.value)} kpi={kpis.new_enquiries} rangeLabel={rangeLabel} hint="Packages, visas and transfers" />
                        <KpiTile label="New subscribers" value={formatCount(kpis.new_subscribers.value)} kpi={kpis.new_subscribers} rangeLabel={rangeLabel} hint={`${formatCount(kpis.new_contacts.value)} contact messages`} />
                    </div>

                    <BusinessLines data={data} />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <RevenueChart data={data} className="xl:col-span-2" />
                        <PaymentStatusBreakdown data={data} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <BookingsChart data={data} className="xl:col-span-2" />
                        <div className="grid grid-cols-1 gap-3">
                            <PaymentMethods data={data} />
                            <HotelInventory data={data} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <TopPackages data={data} />
                        <RecentTransactions data={data} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-8 gap-3">
                <div className="lg:col-span-5 bg-white p-3 rounded-lg border border-slate-200 h-fit">
                    <PortalPackage />
                </div>
                <div className="lg:col-span-3 bg-white p-3 rounded-lg border border-slate-200 h-fit">
                    <PortalNotify />
                </div>
            </div>
        </div>
        </>
    )
}
