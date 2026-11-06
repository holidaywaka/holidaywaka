import { lazy, Suspense } from "react"
import { HydrateFallback } from "~/root";
import { organizationJsonLd, seo, websiteJsonLd } from "~/services/seo";

const LandingIndex  = lazy(() => import("./landing-index"));

// meta must live here: landing-index is lazy-loaded, so React Router never reads its exports
export function meta() {
  return seo({
    path: "/",
    jsonLd: [organizationJsonLd, websiteJsonLd],
  })
}

export default function landing() {
  return (
    <Suspense fallback={<HydrateFallback />}>
      <LandingIndex />
    </Suspense>
  )
}
