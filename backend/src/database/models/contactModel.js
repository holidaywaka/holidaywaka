import { DataTypes } from "sequelize"
import { ModelIDFormat } from "../../config/utilities.js"


function contactModelFn(sequelize) {
    return sequelize.define("Contact", {
        id: ModelIDFormat(DataTypes),
        name: DataTypes.STRING,
        contact: DataTypes.STRING,
        message: DataTypes.TEXT,
    })
}

export default contactModelFn