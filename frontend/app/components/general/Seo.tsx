import { seo, type SeoProps } from "~/services/seo"

// For pages whose tags depend on fetched data. React 19 hoists these into <head> and removes them
// on unmount. The route's own `meta` export must return [] so React Router's <Meta /> doesn't duplicate them.
export default function Seo(props: SeoProps) {
    return (
        <>
            {seo(props).map((tag, index) => {
                if ("title" in tag) return <title key="title">{String(tag.title)}</title>
                if ("script:ld+json" in tag) return (
                    <script
                        key={`ld-${index}`}
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(tag["script:ld+json"]).replace(/</g, "\\u003c") }}
                    />
                )
                if ("tagName" in tag) return <link key={`link-${index}`} rel={tag.rel as string} href={tag.href as string} />
                if ("property" in tag) return <meta key={`p-${index}`} property={tag.property as string} content={tag.content as string} />
                if ("name" in tag) return <meta key={`n-${index}`} name={tag.name as string} content={tag.content as string} />
                return null
            })}
        </>
    )
}
