import { DataTypes } from "sequelize"
import { MainStatusOptions, ModelIDFormat } from "../../config/utilities.js"

function docsModelFn(sequelize) {
    return sequelize.define("Docs", {
        id: ModelIDFormat(DataTypes),
        tag: DataTypes.STRING,
        content: DataTypes.TEXT,
        status: {type: DataTypes.STRING, defaultValue: MainStatusOptions.true},
    })
}

export default docsModelFn