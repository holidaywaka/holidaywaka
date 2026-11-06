import { DataTypes } from "sequelize"
import { ModelIDFormat, ReferenceModelFormat } from "../../config/utilities.js"


function notifyModelFn(sequelize) {
    return sequelize.define("Notify", {
        id: ModelIDFormat(DataTypes),
        userId: DataTypes.UUID,
        // userId: ReferenceModelFormat(DataTypes, "Users"),
        title: DataTypes.STRING,
        content: DataTypes.TEXT,
    })
}

export default notifyModelFn