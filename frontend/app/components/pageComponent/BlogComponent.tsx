

import type { BlogProps } from 'global'
import dayjs from 'dayjs'
import Skeleton from 'react-loading-skeleton'
import { FiArrowUpRight, FiImage } from 'react-icons/fi'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { blogPropsRes } from '~/routes/admin/blogs/types'
import Linked from '~/components/general/Linked'
import { markdownExcerpt } from '~/components/general/Markdown'

function SectionHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-rose-deep">
                    <span className="h-px w-10 bg-rosegold" /> The journal
                </div>
                <h2 className="font-display font-semibold text-primary text-4xl md:text-6xl leading-tight mt-5">Stories to <span className="italic text-rosegold">inspire</span> your next trip</h2>
            </div>
            <Linked to="/blogs" className="inline-flex items-center gap-2 font-bold text-primary border-b-2 border-secondary pb-1 size-fit hover:gap-3 transition-all">All stories <FiArrowUpRight /></Linked>
        </div>
    )
}

export default function BlogComponent() {

    const {data, isLoading} = useFetchResponse<blogPropsRes>({
        endpoint: NewApis.blogs.blogs,
        limit: 3
    })

    if (isLoading) return (
        <section className="w-11/12 max-w-7xl mx-auto py-24 md:py-32">
            <SectionHeader />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {new Array(3).fill(0).map((_, index) => (
                    <div key={index}>
                        <Skeleton style={{ height: '17rem', borderRadius: '1.5rem' }} />
                        <Skeleton count={2} style={{ height: '1.4rem', marginTop: '0.8rem' }} />
                    </div>
                ))}
            </div>
        </section>
    )
    if ((data?.total || 0) > 0) return (
        <section className="w-11/12 max-w-7xl mx-auto py-24 md:py-32">
            <SectionHeader />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data?.data?.slice(0, 3).map((item: BlogProps, index: number) => (
                    <Linked to={`/blogs/${item.slug}/${item.id}`} key={index} className="group block">
                        <div className="h-72 rounded-3xl overflow-hidden bg-blush">
                            {item.media
                                ? <img src={item.media} alt={item.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                : <div className="size-full flex items-center justify-center text-rosegold text-4xl"><FiImage /></div>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-5 uppercase tracking-wider font-semibold">
                            <span>{dayjs(item.createdAt).format('D MMM YYYY')}</span>
                            {item.read && <><span className="size-1 rounded-full bg-rosegold" /> <span>{item.read} min read</span></>}
                        </div>
                        <h3 className="font-display font-semibold text-primary text-2xl md:text-3xl leading-snug mt-2 group-hover:text-rose-deep transition-colors">{item.title}</h3>
                        <p className="text-zinc-600 text-sm mt-2 leading-relaxed">{markdownExcerpt(item.content, 110)}</p>
                    </Linked>
                ))}
            </div>
        </section>
    )
}
