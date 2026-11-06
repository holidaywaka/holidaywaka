import dayjs from "dayjs"
import type { TripProps } from "global"

/** Shared package rules; the server applies the same ones when the order is placed */

const SOLO_PATTERN = /solo|single/i

export const soloPrice = (trip: TripProps | undefined) => trip?.prices?.find((item) => SOLO_PATTERN.test(item.priceType ?? ""))

export const isAdultTag = (tag?: string) => /^adult/i.test(tag ?? "")

/** Private trip with exactly one adult: the solo / single occupancy price is forced */
export function isSoloLocked(trip: TripProps | undefined, adultsCount: number, tag?: string) {
    return trip?.tripType === "PRIVATE" && adultsCount === 1 && isAdultTag(tag) && Boolean(soloPrice(trip))
}

/** Earliest selectable travel date: tomorrow, or later when the package needs a visa */
export function minTravelDate(trip: TripProps | undefined) {
    const tomorrow = dayjs().add(1, "day").startOf("day")
    const visaReady = trip?.earliestTravelDate ? dayjs(trip.earliestTravelDate) : null
    return visaReady && visaReady.isAfter(tomorrow) ? visaReady : tomorrow
}
