

import TripCard from '../../routes/general/packages/trip-card'
import Skeleton from 'react-loading-skeleton'
import Linked from '~/components/general/Linked'
import { ArrowRight } from 'iconsax-reactjs'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { packagePropsRes } from '~/routes/admin/packages/types'

function SectionHeader() {
    return (
        <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-rose-deep">
                <span className="h-px w-10 bg-rosegold" /> Trending now <span className="h-px w-10 bg-rosegold" />
            </div>
            <h2 className="font-display font-semibold text-primary text-4xl md:text-6xl leading-tight mt-5">Escapes everyone is <span className="italic text-rosegold">talking about</span></h2>
            <p className="text-zinc-600 text-lg mt-5">From luxury resorts to adventure-packed tours, handpicked packages to suit every traveller's dream.</p>
        </div>
    )
}

export default function PageTrips() {

    const {data, isLoading} = useFetchResponse<packagePropsRes>({
        endpoint: NewApis.trips.trips,
        isSearch: true,
        limit: 6,
    })

    if (isLoading) return (
        <div className="w-11/12 max-w-7xl mx-auto py-24 md:py-32">
            <SectionHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {new Array(6).fill(0).map((_, index) => (
                    <div key={index}>
                        <Skeleton style={{ height: '18rem', borderRadius: '1.5rem' }} />
                        <Skeleton count={0.6} style={{ height: '1.4rem', marginTop: '1rem' }} />
                        <Skeleton count={2} style={{ marginTop: '0.5rem' }} />
                    </div>
                ))}
            </div>
        </div>
    )

    if (Number(data?.total) > 0) return (
        <section className="py-24 md:py-32">
            <div className="w-11/12 max-w-7xl mx-auto">
                <SectionHeader />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.data?.map((item, index) => (
                        <TripCard item={item} imageHeight="20rem" home={true} key={index} />
                    ))}
                </div>

                <div className="size-fit mx-auto mt-14">
                    <Linked to="/packages" className='inline-flex items-center gap-2 bg-primary text-white font-bold py-3.5 px-8 rounded-full hover:bg-primary/90 transition-colors'>Explore all packages <ArrowRight size="16" /> </Linked>
                </div>
            </div>
        </section>
    )
}
