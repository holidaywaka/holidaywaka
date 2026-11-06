

import {workerData} from "worker_threads"
import db from "../database/index.js"

async function runWorker() {
    // treat all as an array
    const body = workerData.body

    await db.Notifies.bulkCreate(body)
}

runWorker()