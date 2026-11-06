import { writeFileSync } from "fs";
import { EnumChangefreq, SitemapStream, streamToPromise, type SitemapItemLoose } from "sitemap";

const SITE_URL = (process.env.SITE_URL || "https://holidaywaka.com").replace(/\/+$/, "");
const API_URL = (process.env.SITEMAP_API_URL || "https://api.holidaywaka.com/api").replace(/\/+$/, "");

// Only indexable public pages. Search results, checkout, payment, auth and admin screens are noindex or blocked in robots.txt.
const STATIC_PAGES: SitemapItemLoose[] = [
  { url: "/", changefreq: EnumChangefreq.DAILY, priority: 1.0 },
  { url: "/packages", changefreq: EnumChangefreq.DAILY, priority: 0.9 },
  { url: "/hotels", changefreq: EnumChangefreq.WEEKLY, priority: 0.9 },
  { url: "/transfers", changefreq: EnumChangefreq.WEEKLY, priority: 0.9 },
  { url: "/visa", changefreq: EnumChangefreq.WEEKLY, priority: 0.9 },
  { url: "/blogs", changefreq: EnumChangefreq.WEEKLY, priority: 0.7 },
  { url: "/get-in-touch", changefreq: EnumChangefreq.MONTHLY, priority: 0.6 },
];

type ListResponse<T> = { data?: T[]; p?: number; nextPage?: number | null };

// Hard limits so a misbehaving API can never hang the build
const MAX_PAGES = 50;
const REQUEST_TIMEOUT_MS = 15_000;

/** Walks every page of a paginated public list endpoint */
async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const items: T[] = [];
  let page: number | null | undefined = 1;
  for (let fetched = 0; page && fetched < MAX_PAGES; fetched++) {
    const res = await fetch(`${API_URL}/${endpoint}?p=${page}&page_size=100`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`${endpoint} responded ${res.status}`);
    const body = (await res.json()) as ListResponse<T>;
    // Stop if the server ignored the requested page (it keeps answering page 1) or ran out of rows
    if (body.p !== undefined && body.p !== page) break;
    const data = body.data ?? [];
    if (!data.length) break;
    items.push(...data);
    page = body.nextPage;
  }
  return items;
}

async function dynamicPages(
  label: string,
  endpoint: string,
  toItem: (row: any) => SitemapItemLoose | null,
): Promise<SitemapItemLoose[]> {
  try {
    const rows = await fetchAll<any>(endpoint);
    return rows.map(toItem).filter((item): item is SitemapItemLoose => item !== null);
  } catch (e) {
    console.error(`⚠️ Could not fetch ${label} for sitemap: ${(e as Error).message}`);
    return [];
  }
}

const lastmod = (row: { updatedAt?: string; createdAt?: string }) => row.updatedAt || row.createdAt;

async function generateSitemap() {
  const [packages, blogs, docs] = await Promise.all([
    dynamicPages("packages", "trips", (pkg) =>
      pkg.slug && pkg.id ? { url: `/packages/${pkg.slug}/${pkg.id}`, changefreq: EnumChangefreq.WEEKLY, priority: 0.8, lastmod: lastmod(pkg) } : null),
    dynamicPages("blogs", "blogs", (blog) =>
      blog.slug && blog.id ? { url: `/blogs/${blog.slug}/${blog.id}`, changefreq: EnumChangefreq.MONTHLY, priority: 0.6, lastmod: lastmod(blog) } : null),
    // Same slug the footer links to
    dynamicPages("docs", "docs", (doc) =>
      doc.tag ? { url: `/docs/${String(doc.tag).split(" ").join("-").toLowerCase()}`, changefreq: EnumChangefreq.YEARLY, priority: 0.3, lastmod: lastmod(doc) } : null),
  ]);

  const smStream = new SitemapStream({ hostname: SITE_URL });
  const seen = new Set<string>();
  for (const item of [...STATIC_PAGES, ...packages, ...blogs, ...docs]) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    smStream.write(item);
  }
  smStream.end();

  try {
    const sitemap = await streamToPromise(smStream);
    writeFileSync("./public/sitemap.xml", sitemap.toString());
    console.log(`✅ Sitemap generated with ${seen.size} URLs (${packages.length} packages, ${blogs.length} blogs, ${docs.length} docs) at public/sitemap.xml`);
  } catch (err) {
    console.error("❌ Error writing sitemap file:", err);
  }
}

generateSitemap();
