import cron from "node-cron"
import { Op } from "sequelize"
import db from "../repository/trips.repository.js";
import { MainStatusOptions } from "../../../config/utilities.js";
import dayjs from "dayjs";


function SchedulePackageTripStatus() {
    cron.schedule("0 0 * * *", async () => {
        try {
            const updatedCount = await db.Trips.update(
                { status: MainStatusOptions.true },
                {
                    where: {
                        [Op.or]: [
                            { endDate: { [Op.lte]: dayjs().subtract(1, "days").toDate() } }
                        ]
                    }
                }
            );
            console.log(`[CRON] ${updatedCount} trips set to INACTIVE`);

        } catch (error) {
            console.error("Error in Package Trip Status Scheduler:", error);
        }
    });
}

export default SchedulePackageTripStatus