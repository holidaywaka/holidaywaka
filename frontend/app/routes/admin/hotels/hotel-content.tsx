import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'

export function meta() {
    return [{ title: 'Hotel content sync' }]
}

type SyncLog = {
    id: string;
    scope: string;
    status: string;
    params: Record<string, unknown> | null;
    stats: Record<string, unknown> | null;
    error: string | null;
    startedAt: string;
    finishedAt: string | null;
}

type SyncResponse = { data: SyncLog[]; totals: { pending: number; synced: number; regions: number } }

const SCOPES = [
    { scope: 'static', title: 'Reference data', text: 'Filter values, meals, amenities and taxes (monthly).' },
    { scope: 'ids', title: 'Discover hotels', text: 'New and updated hotel ids for the configured countries (nightly).' },
    { scope: 'content', title: 'Hotel content', text: 'Downloads names, photos, rooms and policies for pending hotels (every 15 min).' },
    { scope: 'full', title: 'Full sync', text: 'Runs all three steps in order.' },
]

const STATUS_CLASS: Record<string, string> = {
    running: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
}

/** Step 1 of the ETG flow: static content is synced into our database and never fetched live */
export default function HotelContent() {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery<SyncResponse>({
        queryKey: ['admin-hotel-sync'],
        queryFn: () => createResponse({ endpoint: NewApis.hotels.admin_sync }),
        refetchInterval: (query) => (query.state.data?.data.some((log) => log.status === 'running') ? 5000 : 30_000),
    })
    const start = useMutation({
        mutationFn: (scope: string) => createResponse({ endpoint: NewApis.hotels.admin_sync, method: 'POST', data: { scope } }),
        onSuccess: (response) => { getAlert(response?.message ?? 'Sync started', 'success'); queryClient.invalidateQueries({ queryKey: ['admin-hotel-sync'] }) },
        onError: (error) => getAlert((error as Error).message, 'error'),
    })
    const running = data?.data.some((log) => log.status === 'running')

    return (
        <div>
            <AHeader title="Hotel content" subtitle="RateHawk static content stored locally for search and hotel pages" />
            <div className="w-[96%] mx-auto space-y-3 pb-10">
                <NavLinks options={["home", "hotel-content"]} header="Hotels with content" total={data?.totals.synced ?? 0} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Hotels with content', value: data?.totals.synced },
                        { label: 'Waiting for content', value: data?.totals.pending },
                        { label: 'Destinations (regions)', value: data?.totals.regions },
                    ].map((item) => (
                        <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</div>
                            <div className="text-2xl font-bold tabular-nums">{isLoading ? '…' : (item.value ?? 0).toLocaleString()}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {SCOPES.map((item) => (
                        <div key={item.scope} className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col gap-2">
                            <div className="font-semibold text-zinc-900">{item.title}</div>
                            <div className="text-sm text-zinc-500 flex-1">{item.text}</div>
                            <button type="button" disabled={running || start.isPending} onClick={() => start.mutate(item.scope)} className="h-9 rounded-md border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                                Run now
                            </button>
                        </div>
                    ))}
                </div>
                {running && <div className="text-sm text-blue-800">A sync is running; new runs are disabled until it finishes.</div>}

                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                            <tr><th className="p-3">Scope</th><th className="p-3">Status</th><th className="p-3">Started</th><th className="p-3">Duration</th><th className="p-3">Result</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && <tr><td colSpan={5} className="p-3"><Skeleton count={4} height={20} /></td></tr>}
                            {data?.data.map((log) => (
                                <tr key={log.id}>
                                    <td className="p-3 font-medium capitalize">{log.scope}</td>
                                    <td className="p-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[log.status] ?? ''}`}>{log.status}</span></td>
                                    <td className="p-3 whitespace-nowrap">{dayjs(log.startedAt).format('D MMM YYYY, HH:mm')}</td>
                                    <td className="p-3 whitespace-nowrap">{log.finishedAt ? `${Math.max(1, dayjs(log.finishedAt).diff(dayjs(log.startedAt), 'second'))}s` : '…'}</td>
                                    <td className="p-3 text-xs text-zinc-600 break-all">{log.error ? <span className="text-red-700">{log.error}</span> : log.stats ? Object.entries(log.stats).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(' · ') : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
