import React from 'react'
import dayjs from 'dayjs'
import type { BlogProps } from 'global'
import { FaFacebookF, FaWhatsapp } from 'react-icons/fa6'
import { FiArrowLeft, FiCheck, FiLink } from 'react-icons/fi'
import { SlBookOpen, SlClock } from 'react-icons/sl'
import Skeleton from 'react-loading-skeleton'
import { useParams } from 'react-router'
import Markdown, { markdownExcerpt } from '~/components/general/Markdown'
import Linked from '~/components/general/Linked'
import { getAlert } from '~/services/get-alert'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import Seo from '~/components/general/Seo'
import { absoluteUrl, breadcrumbJsonLd, organizationJsonLd, summarize } from '~/services/seo'

// Tags depend on the fetched post, so <Seo /> renders them instead of React Router's <Meta />
export function meta() {
    return []
}

function BlogSeo({ data, fallbackPath }: { data?: BlogProps, fallbackPath: string }) {
    if (!data?.title) return <Seo title="Travel Blog" path={fallbackPath} />

    const path = `/blogs/${data.slug}/${data.id}`
    const description = summarize(markdownExcerpt(data.content, 400))
    const published = data.createdAt ? dayjs(data.createdAt).toISOString() : undefined
    const image = data.media || data.image

    return (
        <Seo
            title={data.title}
            description={description}
            path={path}
            image={image}
            imageAlt={data.title}
            type="article"
            publishedTime={published}
            jsonLd={[
                {
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    headline: data.title,
                    description,
                    mainEntityOfPage: absoluteUrl(path),
                    ...(image ? { image: absoluteUrl(image) } : {}),
                    ...(published ? { datePublished: published } : {}),
                    author: { "@type": "Organization", name: organizationJsonLd.name, url: organizationJsonLd.url },
                    publisher: { "@type": "Organization", name: organizationJsonLd.name, logo: { "@type": "ImageObject", url: organizationJsonLd.logo } },
                },
                breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Blog", path: "/blogs" },
                    { name: data.title, path },
                ]),
            ]}
        />
    )
}

export default function singleblog() {
    const { id, slug } = useParams()
    const {data, isLoading} = useFetchResponse<BlogProps>({
        endpoint: `${NewApis.blogs.blogs}/${id}`
    })

    const seo = <BlogSeo data={data} fallbackPath={`/blogs/${slug}/${id}`} />

    if (isLoading) return (
        <div className="bg-background">
            {seo}
            <div className="w-11/12 max-w-3xl mx-auto pt-14">
                <Skeleton count={0.3} style={{ height: '1rem' }} />
                <Skeleton count={2} style={{ height: '2.6rem', marginTop: '1rem' }} />
            </div>
            <div className="w-11/12 max-w-6xl mx-auto mt-10">
                <Skeleton style={{ height: '28rem', borderRadius: '1.5rem' }} />
            </div>
            <div className="w-11/12 max-w-3xl mx-auto py-12">
                <Skeleton count={8} style={{ marginTop: '0.8rem' }} />
            </div>
        </div>
    )

    if (!data?.title) return (
        <div className="bg-background py-24 text-center w-11/12 mx-auto">
            {seo}
            <h1 className="font-extrabold text-2xl text-primary">We couldn't find that story</h1>
            <p className="text-zinc-500 mt-2">It may have been moved or unpublished.</p>
            <Linked to="/blogs" className="inline-flex items-center gap-2 mt-6 font-semibold text-primary"> <FiArrowLeft /> Back to all stories</Linked>
        </div>
    )

    return (
        <article className="bg-background">
            {seo}
            <header className="w-11/12 max-w-3xl mx-auto pt-12 md:pt-16 text-center">
                <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <Linked to="/" className="hover:text-primary">Home</Linked> <span>/</span>
                    <Linked to="/blogs" className="hover:text-primary">Blog</Linked>
                </nav>
                <h1 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-primary leading-tight mt-5">{data.title}</h1>
                <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 mt-6">
                    <span className="flex items-center gap-1.5"> <SlClock /> {dayjs(data.createdAt).format('D MMMM YYYY')}</span>
                    {data.read && <span className="flex items-center gap-1.5"> <SlBookOpen /> {data.read} min read</span>}
                </div>
            </header>
            {data.media && <div className="w-11/12 max-w-6xl mx-auto mt-10">
                <img src={data.media} alt={data.title} className="w-full h-64 md:h-[28rem] lg:h-[32rem] object-cover rounded-3xl" />
            </div>}
            <div className="w-11/12 max-w-3xl mx-auto py-12 md:py-16">
                <Markdown content={data.content || ''} />
                <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <Linked to="/blogs" className="inline-flex items-center gap-2 font-semibold text-primary hover:gap-3 transition-all"> <FiArrowLeft /> All stories</Linked>
                    <ShareLinks title={data.title} />
                </div>
            </div>
        </article>
    )
}

function ShareLinks({ title }: { title: string }) {
    const [copied, setCopied] = React.useState(false)
    const pageUrl = () => window.location.href
    const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')
    async function copy() {
        try {
            await navigator.clipboard.writeText(pageUrl())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            getAlert('Could not copy the link', 'error')
        }
    }
    const button = "size-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-zinc-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 mr-1">Share</span>
            <button type="button" aria-label="Share on WhatsApp" className={button} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl()}`)}`)}> <FaWhatsapp /> </button>
            <button type="button" aria-label="Share on Facebook" className={button} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`)}> <FaFacebookF /> </button>
            <button type="button" aria-label="Copy link" className={button} onClick={copy}> {copied ? <FiCheck /> : <FiLink />} </button>
        </div>
    )
}
