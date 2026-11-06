import React from 'react'
import dayjs from 'dayjs'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import AHeader from '~/components/admin/AHeader'
import Formbutton from '~/components/general/Formbutton'
import { createResponse, NewApis } from '~/services/new-apis'
import RangeTabs from '~/routes/admin/portal/dashboard-range'
import { formatNaira, formatNairaCompact, formatPercent } from '~/routes/admin/portal/dashboard-theme'
import type { DashboardRange, InsightsResponse } from '~/routes/admin/portal/dashboard-types'
import {
  Customers, Destinations, Funnels, HotelDemand, LeadTime, LineTrends, RequestWeekdays, Seasonality, Takeaways,
} from '~/routes/admin/insights/insights-sections'

export default function analytics() {
  const [range, setRange] = React.useState<DashboardRange>('12m')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<InsightsResponse>({
    queryKey: ['admin-insights', range],
    queryFn: () => createResponse({ endpoint: `${NewApis.dashboard.insights}?range=${range}` }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <>
      <AHeader title="Insights" subtitle="Where revenue and margin come from, and how customers buy" />
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl lg:text-3xl text-zinc-900">Business insights</h1>
            <div className="text-sm text-zinc-500">
              {data ? `${dayjs(data.range.start).format('D MMM YYYY')} – ${dayjs(data.range.end).format('D MMM YYYY')} · amounts in Naira` : 'Loading insights...'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading && <span className="text-xs text-zinc-500">Updating...</span>}
            <RangeTabs value={range} onChange={setRange} options={['30d', '90d', '12m']} />
          </div>
        </div>

        {isError && !data && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-sm space-y-3">
            <div className="text-red-600">{(error as Error)?.message || 'Unable to load insights'}</div>
            <div className="w-fit mx-auto"><Formbutton title="Try again" type="button" onClick={() => refetch()} /></div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton height={140} borderRadius={8} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{new Array(4).fill(0).map((_, index) => <Skeleton key={index} height={260} borderRadius={8} />)}</div>
          </div>
        )}

        {data && (
          <div className={`space-y-4 ${isFetching ? 'opacity-70' : ''} transition-opacity`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Revenue</div>
                <div className="text-2xl font-bold tabular-nums text-zinc-900" title={formatNaira(data.totals.revenue)}>{formatNairaCompact(data.totals.revenue)}</div>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Gross margin</div>
                <div className="text-2xl font-bold tabular-nums text-zinc-900" title={formatNaira(data.totals.margin)}>{formatNairaCompact(data.totals.margin)}</div>
                {data.totals.margin_estimated && <div className="text-xs text-zinc-500">Partly estimated from current markups</div>}
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Margin rate</div>
                <div className="text-2xl font-bold tabular-nums text-zinc-900">{formatPercent(data.totals.margin_rate)}</div>
                <div className="text-xs text-zinc-500">of revenue, VAT excluded</div>
              </div>
            </div>

            <Takeaways data={data} />
            <LineTrends data={data} />
            <Funnels data={data} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <LeadTime data={data} />
              <Seasonality data={data} />
              <RequestWeekdays data={data} />
            </div>

            <Destinations data={data} />
            <Customers data={data} />
            <HotelDemand data={data} />
          </div>
        )}
      </div>
    </>
  )
}
