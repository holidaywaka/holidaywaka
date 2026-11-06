

import Skeleton from "react-loading-skeleton"
import GlobalErrorScreen from "~/components/general/GlobalErrorScreen"
import { SlBookOpen, SlClock } from "react-icons/sl"
import { FiArrowRight, FiImage } from "react-icons/fi"
import Linked from '~/components/general/Linked'
import { markdownExcerpt } from "~/components/general/Markdown"
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { blogPropsRes } from "~/routes/admin/blogs/types"
import type { BlogProps } from "global"
import TablePagination from "~/components/Table/TablePagination"
import dayjs from "dayjs"
import { useSearchParams } from "react-router"
import { canonicalPath, seo } from "~/services/seo"
import type { Route } from "./+types/blogs"

export function meta({ location }: Route.MetaArgs) {
    return seo({
        title: "Travel Blog – Tips, Guides & Destination Ideas",
        description: "Travel tips, destination guides, visa advice and holiday inspiration from the HolidayWaka team.",
        path: canonicalPath(location),
    })
}

export default function BlogsPage() {
    const [searchParams] = useSearchParams()
    const { data, isLoading, isError, refetch } = useFetchResponse<blogPropsRes>({
        endpoint: NewApis.blogs.blogs,
        isSearch: true,
    })
    const total = data?.total || 0
    const posts = data?.data ?? []
    const isFirstPage = Number(searchParams.get("p") ?? 1) <= 1
    const [featured, ...rest] = isFirstPage ? posts : [undefined, ...posts]

    function pageAction() {
        refetch()
    }

    const header = (
        <section className="bg-primary relative overflow-hidden">
            <div className="absolute -top-20 -right-20 size-80 rounded-full bg-secondary/10" aria-hidden />
            <div className="w-11/12 max-w-7xl mx-auto py-16 md:py-20 relative">
                <div className="inline-flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-[0.2em]">
                    <span className="h-px w-8 bg-secondary" /> The travel journal
                </div>
                <h1 className="font-extrabold text-4xl lg:text-5xl text-white mt-4">Stories, tips &amp; destination guides</h1>
                <p className="text-white/75 text-lg mt-4 max-w-2xl">Travel ideas, visa advice and insider know-how from our team, to help you plan your next trip with confidence.</p>
            </div>
        </section>
    )

    if (isLoading) return (
        <div>
            {header}
            <div className="w-11/12 max-w-7xl mx-auto py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <Skeleton style={{ height: '22rem', borderRadius: '1.5rem' }} />
                    <div><Skeleton count={0.4} style={{ height: '1rem' }} /><Skeleton count={2} style={{ height: '2.2rem', marginTop: '1rem' }} /><Skeleton count={3} style={{ marginTop: '0.6rem' }} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {new Array(3).fill(0).map((_, index) => (
                        <div key={index}>
                            <Skeleton style={{ height: '14rem', borderRadius: '1rem' }} />
                            <Skeleton count={2} style={{ height: '1.4rem', marginTop: '0.8rem' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    if (isError) return <GlobalErrorScreen />

    if (total < 1) return (
        <div>
            {header}
            <div className="w-11/12 max-w-xl mx-auto py-24 text-center">
                <div className="size-16 rounded-2xl bg-secondary/20 text-primary text-2xl flex items-center justify-center mx-auto"> <SlBookOpen /> </div>
                <h2 className="font-bold text-xl text-primary mt-5">No stories yet</h2>
                <p className="text-zinc-500 mt-2">We're working on our first travel guides. Check back soon.</p>
            </div>
        </div>
    )

    return (
        <div className="bg-background">
            {header}
            <div className="w-11/12 max-w-7xl mx-auto py-14">
                {featured && <FeaturedPost item={featured} />}
                {rest.length > 0 && <>
                    {featured && <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mt-16 mb-6">More stories</h2>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {rest.map((item, index) => item && <PostCard item={item} key={index} />)}
                    </div>
                </>}
                {total > posts.length && <div className="mt-14">
                    <TablePagination
                        total={total}
                        pageAction={pageAction}
                    />
                </div>}
            </div>
        </div>
    )
}

const postUrl = (item: BlogProps) => `/blogs/${item.slug}/${item.id}`

function Cover({ src, alt, className }: { src?: string, alt: string, className: string }) {
    if (!src) return (
        <div className={`${className} bg-slate-200 flex items-center justify-center text-zinc-400 text-3xl`}> <FiImage /> </div>
    )
    return (
        <div className={`${className} overflow-hidden bg-slate-200`}>
            <img src={src} alt={alt} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
    )
}

function PostMeta({ item }: { item: BlogProps }) {
    return (
        <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"> <SlClock /> {dayjs(item.createdAt).format('D MMM YYYY')}</span>
            {item.read && <span className="flex items-center gap-1.5"> <SlBookOpen /> {item.read} min read</span>}
        </div>
    )
}

function FeaturedPost({ item }: { item: BlogProps }) {
    return (
        <Linked to={postUrl(item)} className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-slate-100 p-4 md:p-5 hover:shadow-xl hover:shadow-primary/5 transition-shadow">
            <Cover src={item.media} alt={item.title} className="h-64 md:h-80 rounded-2xl" />
            <div className="p-2 md:p-4">
                <span className="inline-block text-xs font-bold uppercase tracking-wider bg-secondary/20 text-primary rounded-full px-3 py-1 mb-4">Latest</span>
                <PostMeta item={item} />
                <h2 className="font-extrabold text-2xl md:text-3xl text-primary leading-tight mt-3 group-hover:text-secondary transition-colors">{item.title}</h2>
                <p className="text-zinc-600 mt-3 leading-relaxed">{markdownExcerpt(item.content, 220)}</p>
                <span className="inline-flex items-center gap-2 font-semibold text-primary mt-6 group-hover:gap-3 transition-all">Read article <FiArrowRight /></span>
            </div>
        </Linked>
    )
}

function PostCard({ item }: { item: BlogProps }) {
    return (
        <Linked to={postUrl(item)} className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all">
            <Cover src={item.media} alt={item.title} className="h-52" />
            <div className="p-5 flex flex-col flex-1">
                <PostMeta item={item} />
                <h3 className="font-bold text-lg text-primary leading-snug mt-3 group-hover:text-secondary transition-colors">{item.title}</h3>
                <p className="text-sm text-zinc-600 mt-2 flex-1">{markdownExcerpt(item.content, 120)}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-4 group-hover:gap-3 transition-all">Read more <FiArrowRight /></span>
            </div>
        </Linked>
    )
}
