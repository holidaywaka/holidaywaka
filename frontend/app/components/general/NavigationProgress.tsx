import { useNavigation } from 'react-router'

/**
 * True while the router is moving to another page (route code still downloading).
 * With `to`, only when that exact link is the one loading, so a single button can show it.
 */
export function useIsNavigating(to?: string) {
    const navigation = useNavigation()
    if (navigation.state === 'idle' || !navigation.location) return false
    if (!to) return true
    const target = new URL(to, window.location.origin)
    return navigation.location.pathname === target.pathname && navigation.location.search === target.search
}

/** Small white spinner for primary buttons */
export function ButtonSpinner() {
    return <span aria-hidden className="inline-block size-4 shrink-0 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}

/** Thin bar across the top of the screen while any page change is in progress */
export default function NavigationProgress() {
    const isNavigating = useIsNavigating()
    if (!isNavigating) return null
    return (
        <div role="progressbar" aria-label="Loading page" className="fixed top-0 left-0 right-0 z-[1000] h-1 overflow-hidden bg-primary/20">
            <div className="h-full w-1/3 bg-primary animate-[nav-progress_1s_ease-in-out_infinite]" />
        </div>
    )
}
