import { DataTypes } from "sequelize"
import { jsonColumn } from "./hotelModelUtils.js"

export const HotelStaticDataKeys = {
    filter_values: "filter_values", // content/v1/filter_values
    hotel_static: "hotel_static",   // b2b/v3/hotel/static (meal, amenity, tax translations)
}

// Key/value store for ETG reference dumps
function hotelStaticDataModelFn(sequelize) {
    return sequelize.define("HotelStaticData", {
        key: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            allowNull: false,
        },
        data: jsonColumn(DataTypes, "data", null),
        syncedAt: DataTypes.DATE,
    }, {
        freezeTableName: true,
    })
}

export default hotelStaticDataModelFn
