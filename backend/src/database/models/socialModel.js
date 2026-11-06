import { DataTypes } from "sequelize"
import { ModelIDFormat, MainStatusOptions } from "../../config/utilities.js"


function socialModelFn(sequelize) {
    return sequelize.define("Social", {
        id: ModelIDFormat(DataTypes),
        tag: DataTypes.STRING,
        link: DataTypes.TEXT,
        status: {type: DataTypes.STRING, defaultValue: MainStatusOptions.true},
    })
}

export default socialModelFn