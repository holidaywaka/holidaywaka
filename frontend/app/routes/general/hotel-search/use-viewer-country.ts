import type { geoLocationProps } from "global";
import { useSelector } from "react-redux";
import { LocalStorageName } from "~/components/utils";
import type { RootState } from "~/store/store";

/**
 * Visitor country from the IP geolocation done in the visitors layout.
 * Hotel prices are shown in NGN only when this is Nigeria; otherwise (including unknown) in USD.
 */
export function useViewerCountry(): string | null {
    const { geoLocation } = useSelector((state: RootState) => state.data);
    if (geoLocation?.country_code) return geoLocation.country_code;
    try {
        const locals: geoLocationProps | null = JSON.parse(localStorage.getItem(LocalStorageName) ?? "null");
        return locals?.country_code ?? null;
    } catch {
        return null;
    }
}
