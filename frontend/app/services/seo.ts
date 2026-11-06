import type { MetaDescriptor } from "react-router";
import { SiteName } from "~/components/utils";

export const SITE_URL = ((import.meta.env?.VITE_SITE_URL as string | undefined) || "https://holidaywaka.com").replace(/\/+$/, "");
export const DEFAULT_DESCRIPTION = "Book holiday packages, hotels, airport transfers and visa applications in one place. Your journey, your way – adventure tailored just for you!";
export const DEFAULT_IMAGE = "/images/logo.png";

type JsonLd = Record<string, unknown>;

export type SeoProps = {
    /** Page title without the brand; the brand is appended */
    title?: string
    description?: string
    /** Path (or absolute URL) used for the canonical link and og:url; omit to leave both out */
    path?: string
    image?: string
    imageAlt?: string
    type?: "website" | "article" | "product"
    /** Keep the page out of search results while still following its links */
    noindex?: boolean
    publishedTime?: string
    modifiedTime?: string
    jsonLd?: JsonLd | JsonLd[]
}

export function absoluteUrl(pathOrUrl: string) {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Collapses whitespace and cuts text to a search-snippet friendly length on a word boundary */
export function summarize(text?: string | null, max = 160) {
    const clean = (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Canonical path for a route: the pathname, plus ?page when paginated past page 1. Filters are dropped. */
export function canonicalPath(location: { pathname: string; search?: string }) {
    const page = new URLSearchParams(location.search).get("page");
    const pathname = location.pathname.length > 1 ? location.pathname.replace(/\/+$/, "") : "/";
    return page && page !== "1" ? `${pathname}?page=${encodeURIComponent(page)}` : pathname;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

/** Full set of tags for a public page: title, description, robots, canonical, Open Graph, Twitter and JSON-LD */
export function seo({
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    image = DEFAULT_IMAGE,
    imageAlt,
    type = "website",
    noindex = false,
    publishedTime,
    modifiedTime,
    jsonLd,
}: SeoProps = {}): MetaDescriptor[] {
    const fullTitle = title ? `${title} | ${SiteName}` : `${SiteName} – Holiday Packages, Hotels, Airport Transfers & Visas`;
    const imageUrl = absoluteUrl(image);
    const url = path && !noindex ? absoluteUrl(path) : undefined;
    const ogTitle = title || SiteName;

    const tags: MetaDescriptor[] = [
        { title: fullTitle },
        { name: "description", content: description },
        { name: "robots", content: noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:site_name", content: SiteName },
        { property: "og:locale", content: "en_US" },
        { property: "og:type", content: type },
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: description },
        { property: "og:image", content: imageUrl },
        { property: "og:image:alt", content: imageAlt || ogTitle },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ogTitle },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
    ];

    if (url) {
        tags.push({ tagName: "link", rel: "canonical", href: url }, { property: "og:url", content: url });
    }
    if (publishedTime) tags.push({ property: "article:published_time", content: publishedTime });
    if (modifiedTime) tags.push({ property: "article:modified_time", content: modifiedTime });

    for (const data of [jsonLd ?? []].flat()) {
        tags.push({ "script:ld+json": data });
    }

    return tags;
}

/** Pages that must never appear in search: checkout, payment, account and utility screens */
export function privatePage(title: string): MetaDescriptor[] {
    return [
        { title: `${title} | ${SiteName}` },
        { name: "robots", content: "noindex, nofollow" },
    ];
}

export const organizationJsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SiteName,
    url: SITE_URL,
    logo: absoluteUrl("/images/logo.png"),
    image: absoluteUrl(DEFAULT_IMAGE),
};

export const websiteJsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SiteName,
    url: SITE_URL,
};
