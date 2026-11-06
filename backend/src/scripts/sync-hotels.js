/**
 * Manual / bootstrap run of the hotel static content sync (ETG step 1).
 *
 *   npm run hotels:sync                     # full: static data, hotel ids, content
 *   npm run hotels:sync -- content          # only drain pending content
 *   npm run hotels:sync -- ids --countries=201,59 --full-discovery
 *   npm run hotels:sync -- content --max=20000
 */
import db from "../database/index.js"
import { HotelSyncScopes } from "../database/models/hotelSyncLogModel.js"
import { runHotelSync } from "../modules/hotels/services/content-sync.service.js"

const args = process.argv.slice(2)
const scope = args.find((arg) => !arg.startsWith("--")) ?? HotelSyncScopes.full
const flag = (name) => args.find((arg) => arg.startsWith(`--${name}`))?.split("=")[1]

if (!Object.values(HotelSyncScopes).includes(scope)) {
    console.error(`Unknown scope "${scope}". Use one of: ${Object.values(HotelSyncScopes).join(", ")}`)
    process.exit(1)
}

await db.ready

const { log } = await runHotelSync(scope, {
    wait: true,
    countries: flag("countries")?.split(",").map(Number).filter(Boolean),
    maxHotels: flag("max") ? Number(flag("max")) : undefined,
    fullDiscovery: args.includes("--full-discovery"),
})

await log.reload()
console.log(JSON.stringify({ status: log.status, stats: log.stats, error: log.error }, null, 2))
await db.sequelize.close()
process.exit(log.status === "success" ? 0 : 1)
