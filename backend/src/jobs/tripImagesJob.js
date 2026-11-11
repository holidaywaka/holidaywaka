import { parentPort, workerData } from "worker_threads"
import fs from "fs/promises"
import db from "../database/index.js"
import { UploadImage, DeleteImage } from "../config/cloudinaryConfig.js"
import { cacheKeys } from "../config/cacheConfig.js"
import logger from "../middleware/logger.js"

/**
 * Uploads a package's images to Cloudinary in the background, one at a time.
 * workerData: { tripId, userId, files: [{ path, name, mimetype }] } — files are temp copies written by the
 * upload endpoint. Each success is appended to the trip's images straight away, so one failing image never
 * undoes or blocks the others. Failures are reported to the admin as a notification.
 */

/** Appends under a row lock: concurrent jobs and the delete-image endpoint all read-modify-write the same JSON list */
async function appendImage(tripId, url) {
    return db.sequelize.transaction(async (transaction) => {
        const trip = await db.Trips.findOne({ where: { id: tripId }, transaction, lock: transaction.LOCK.UPDATE })
        if (!trip) return null
        await trip.update({ images: [...(trip.images ?? []), url] }, { transaction })
        return trip
    })
}

async function runWorker() {
    const { tripId, userId, files = [] } = workerData
    const failed = []
    let uploaded = 0
    let title = ""

    try {
        for (const file of files) {
            try {
                const data = await fs.readFile(file.path)
                const result = await UploadImage({ data, name: file.name, mimetype: file.mimetype })
                if (result.status !== 200) {
                    failed.push(file.name)
                    continue
                }

                const trip = await appendImage(tripId, result.media)
                if (!trip) {
                    // Package was deleted while uploading: don't leave the image orphaned in Cloudinary
                    await DeleteImage(result.media)
                    logger.info(`[trip-images] trip ${tripId} no longer exists, discarded ${file.name}`)
                    break
                }
                title = trip.title
                uploaded++
                // The listing cache lives in the main process
                parentPort?.postMessage({ clearCache: [cacheKeys.trips, cacheKeys.trip_filters] })
            } catch (error) {
                failed.push(file.name)
                logger.error(`[trip-images] ${file.name} for trip ${tripId} failed: ${error?.message ?? error}`)
            } finally {
                await fs.rm(file.path, { force: true }).catch(() => { })
            }
        }

        if (failed.length && userId) {
            title ||= (await db.Trips.findOne({ where: { id: tripId }, attributes: ["title"] }))?.title ?? "a package"
            await db.Notifies.create({
                userId,
                title: "Package image upload failed",
                content: `${failed.length} of ${files.length} image(s) for "${title}" could not be uploaded: ${failed.join(", ")}. ${uploaded} uploaded successfully. Open the package and add the failed image(s) again.`
            })
        }
        logger.info(`[trip-images] trip ${tripId}: ${uploaded} uploaded, ${failed.length} failed`)
    } catch (error) {
        logger.error(`[trip-images] job for trip ${tripId} crashed: ${error?.message ?? error}`)
    } finally {
        // Remove any temp files left behind if the loop stopped early
        await Promise.all(files.map((file) => fs.rm(file.path, { force: true }).catch(() => { })))
        await db.sequelize.close().catch(() => { })
        parentPort?.postMessage("done")
    }
}

runWorker()
