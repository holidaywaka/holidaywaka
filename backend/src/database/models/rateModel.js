import { DataTypes } from "sequelize"
import { dbStringToJson, ModelIDFormat } from "../../config/utilities.js"

function rateModelFn(sequelize) {
    return sequelize.define("Rate", {
        id: ModelIDFormat(DataTypes),
        source: DataTypes.STRING,
        quotes: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('quotes'))
            }
        }, // quote = USD, value = 1500 of(NGN - source)
        status: DataTypes.STRING,
    })
}

export default rateModelFn