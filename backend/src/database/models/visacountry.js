
import { DataTypes } from "sequelize"
import { ModelIDFormat, MainStatusOptions, dbStringToJson } from "../../config/utilities.js"

function visaCountryModelFn(sequelize) {
    return sequelize.define('VisaCountry', {
        id: ModelIDFormat(DataTypes),
        country: DataTypes.STRING,
        fee: DataTypes.STRING,
        status: { type: DataTypes.STRING, defaultValue: MainStatusOptions.true },
        destinations: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('destinations'))
            }
        }, // visaType, price, requirements
    })
}

export default visaCountryModelFn