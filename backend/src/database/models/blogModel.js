import { DataTypes } from "sequelize"
import { ModelIDFormat, MainStatusOptions } from "../../config/utilities.js"



function blogModelFn (sequelize) {
    return sequelize.define("Blog", {
        id: ModelIDFormat(DataTypes),
        title: DataTypes.STRING,
        url: DataTypes.TEXT,
        read: DataTypes.STRING,
        content: DataTypes.TEXT,
        slug: DataTypes.TEXT,
        media: DataTypes.STRING,
        status: {type: DataTypes.STRING, defaultValue: MainStatusOptions.true},
    })
}

export default blogModelFn