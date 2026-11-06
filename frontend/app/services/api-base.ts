// Picks the backend from the exact hostname the site is served on.
// Only holidaywaka.com / www.holidaywaka.com talk to the live API; any other
// non-local host (dev.holidaywaka.com, onrender previews, etc.) uses apidev.
const LIVE_URL = "https://api.holidaywaka.com/api"
const DEV_URL = "https://apidev.holidaywaka.com/api"
const LOCAL_URL = "http://localhost:8002/api"

function resolveApiUrl(): string {
    const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : ""
    if (host === "localhost" || host === "127.0.0.1") return LOCAL_URL
    if (host === "holidaywaka.com" || host === "www.holidaywaka.com") return LIVE_URL
    return DEV_URL
}

export const API_URL = resolveApiUrl()
