
import { Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { TripProps } from 'global'
import { BsFilter } from 'react-icons/bs'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router'
import EmptyList from '~/components/pageComponent/EmptyList'
import FilterComponent, { PACKAGE_FILTER_KEYS } from '~/routes/general/packages/trip-filter-component'
import TripCard from '~/routes/general/packages/trip-card'
import TablePagination from '~/components/Table/TablePagination'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import { canonicalPath, seo } from '~/services/seo'
import type { Route } from './+types/packages'


export function meta({ location }: Route.MetaArgs) {
    return seo({
        title: "Holiday Packages – Private & Group Trips",
        description: "Browse curated holiday packages, private getaways and group trips with itineraries, inclusions and transparent pricing. Book your next adventure with HolidayWaka.",
        path: canonicalPath(location),
    })
}

type responseProps = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": TripProps[]
}

export default function packages() {
    const [opened, { open, close }] = useDisclosure(false)
    const [searchParams, setSearchParams] = useSearchParams();

    const { data, isLoading, refetch } = useFetchResponse<responseProps>({
        endpoint: NewApis.trips.trips,
        isSearch: true,
        query: {
            status: 'true'
        },
        searchParams: searchParams,
    })

    function pageAction() {
        refetch()
    }

    const hasFilters = PACKAGE_FILTER_KEYS.some((key) => searchParams.get(key))
    function clearFilters() {
        const params = new URLSearchParams(searchParams)
        PACKAGE_FILTER_KEYS.forEach((key) => params.delete(key))
        params.delete('p')
        setSearchParams(params)
    }

    return (
        <div className='relative'>
            <div className="py-10">
                <div className="w-11/12 mx-auto">
                    <div className="font-bold text-3xl lg:text-4xl">Holiday Packages</div>
                    {!isLoading && data && <div className="text-zinc-500 mt-1">{Number(data.total ?? 0).toLocaleString()} {Number(data.total) === 1 ? 'package' : 'packages'}{hasFilters ? ' match your filters' : ' available'}</div>}
                </div>
            </div>
            <div className="pb-10 text-sm">
                <div className="w-11/12 mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
                        <Drawer opened={opened} onClose={close}>
                            <div className="lg:hidden">
                                <FilterComponent />
                            </div>
                        </Drawer>
                        <div className="lg:col-span-2 hidden lg:block">
                            {/* Filters stay available when nothing matches, so the visitor can widen the search */}
                            <div className={`h-fit border border-slate-200! rounded-md sticky! top-16 left-0`}>
                                <FilterComponent />
                            </div>
                        </div>
                        <div className="lg:col-span-5">
                            <div>
                                <div
                                    onClick={open}
                                    className="w-fit py-2 cursor-pointer hover:scale-105 transition-all px-3 rounded-md bg-white border border-slate-300 mb-3 flex lg:hidden ml-auto items-center gap-2">Filter <BsFilter className="text-xl" /></div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

                                    {isLoading && new Array(10).fill(0).map((_, index) => (
                                        <div className="bg-zinc-100 p-3" key={index}>
                                            <Skeleton baseColor='lightgrey' style={{ height: '15rem' }} />
                                            <Skeleton count={.5} baseColor='lightgrey' style={{ height: '2rem', marginTop: '1rem' }} />
                                            <Skeleton count={2} baseColor='lightgrey' style={{ height: '2rem', marginTop: '1rem' }} />
                                        </div>
                                    ))}
                                    {(!isLoading && (Number(data?.data?.length ?? 0) === 0)) && <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                        {hasFilters ? (
                                            <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
                                                <div className="font-semibold text-base">No packages match these filters</div>
                                                <div className="text-zinc-500">Try removing a filter or widening the price range.</div>
                                                <button type="button" onClick={clearFilters} className="h-10 px-4 rounded-md bg-primary text-white font-semibold cursor-pointer">Clear filters</button>
                                            </div>
                                        ) : <EmptyList />}
                                    </div> }

                                    {(!isLoading && (Number(data?.data?.length ?? 0) > 0)) && data?.data?.map((item: TripProps, index: number) => (
                                        <div key={index}>
                                            <TripCard home={false} item={item} imageHeight='12rem' />
                                        </div>
                                    ))}
                                </div>
                                <TablePagination total={data?.total ?? 0} pageAction={pageAction} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
