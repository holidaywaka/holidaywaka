import { DataTypes } from "sequelize"

// ETG regions, derived from the `region` block of synced hotel content.
// Backs the destination autocomplete and supplies `region_id` for region search.
function hotelRegionModelFn(sequelize) {
    return sequelize.define("HotelRegions", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false,
        },
        name: DataTypes.STRING,
        type: DataTypes.STRING(64),
        countryCode: DataTypes.STRING(2),
        iata: DataTypes.STRING(8),
        hotelsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        indexes: [
            { fields: ["name"] },
        ]
    })
}

export default hotelRegionModelFn
