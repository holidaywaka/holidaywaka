import { DataTypes } from "sequelize"
import { ModelIDFormat } from "../../config/utilities.js"


function newsletterModelFn(sequelize) {
    return sequelize.define("NewsLetter", {
        id: ModelIDFormat(DataTypes),
        email: DataTypes.STRING
    })
}

export default newsletterModelFn