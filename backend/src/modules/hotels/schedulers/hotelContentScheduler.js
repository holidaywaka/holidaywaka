import cron from "node-cron"
import logger from "../../../middleware/logger.js"
import { HotelSyncScopes } from "../../../database/models/hotelSyncLogModel.js"
import { hasPendingHotelContent, runHotelSync } from "../services/content-sync.service.js"

// Step 1 of the ETG flow: keep static content fresh, independently of customer traffic.
function HotelContentScheduler() {
    if (process.env.RATEHAWK_SYNC_ENABLED === "false") {
        logger.info("[hotel-sync] scheduler disabled (RATEHAWK_SYNC_ENABLED=false)")
        return
    }

    const run = (scope) => async () => {
        try {
            await runHotelSync(scope, { wait: true })
        } catch (error) {
            logger.error(`[hotel-sync] scheduled ${scope} failed: ${error.message}`)
        }
    }

    // Filter values + hotel static data: ETG asks for a monthly refresh
    cron.schedule("0 3 1 * *", run(HotelSyncScopes.static))

    // Discover new and updated hotels (incremental via updated_since) every night
    cron.schedule("30 2 * * *", run(HotelSyncScopes.ids))

    // Drain the pending-content queue (new ids, updates, hotels first seen in search results)
    cron.schedule("*/15 * * * *", async () => {
        try {
            if (await hasPendingHotelContent()) await run(HotelSyncScopes.content)()
        } catch (error) {
            logger.error(`[hotel-sync] pending content check failed: ${error.message}`)
        }
    })
}

export default HotelContentScheduler
