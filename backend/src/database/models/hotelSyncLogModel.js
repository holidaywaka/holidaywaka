import { DataTypes } from "sequelize"
import { ModelIDFormat } from "../../config/utilities.js"
import { jsonColumn } from "./hotelModelUtils.js"

export const HotelSyncScopes = {
    static: "static",   // filter values + hotel static data
    ids: "ids",         // hotel ids by filter (discovers new / updated hotels)
    content: "content", // hotel content for pending hids
    full: "full",       // all of the above
}

export const HotelSyncStatus = {
    running: "running",
    success: "success",
    failed: "failed",
}

function hotelSyncLogModelFn(sequelize) {
    return sequelize.define("HotelSyncLogs", {
        id: ModelIDFormat(DataTypes),
        scope: DataTypes.STRING(16),
        status: { type: DataTypes.STRING(16), defaultValue: HotelSyncStatus.running },
        params: jsonColumn(DataTypes, "params", null),
        stats: jsonColumn(DataTypes, "stats", null),
        error: DataTypes.TEXT,
        startedAt: DataTypes.DATE,
        finishedAt: DataTypes.DATE,
    }, {
        indexes: [
            { fields: ["scope", "status", "startedAt"] },
        ]
    })
}

export default hotelSyncLogModelFn
