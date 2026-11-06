
import { hashPassword } from "../config/utilities.js";
import logger from "../middleware/logger.js";
import db from "../database/index.js";
import {workerData} from "worker_threads"


async function runWorker() {
    try {
        const body = workerData.body;
        const password = await hashPassword(body.password);
        await db.Users.update(
            {password},
            {
                where: {
                    id: body.id
                }
            }
        )

        logger.info("Password re-hashed");
    } catch (error) {
        logger.error("Error re-hashing password", error)
    }
};

runWorker();