import { DataTypes } from "sequelize"
import { ModelIDFormat, MainStatusOptions } from "../../config/utilities.js"

function markupModelFn (sequelize) {
    return sequelize.define('Markup', {
        id: ModelIDFormat(DataTypes),
        tag: DataTypes.STRING,
        currency: DataTypes.STRING,
        discountType: DataTypes.STRING,
        discountValue: {type: DataTypes.FLOAT, defaultValue: 0},
        vat: {type: DataTypes.FLOAT, defaultValue: 0},
        status: { type: DataTypes.STRING, defaultValue: MainStatusOptions.true },
    })
}

export default markupModelFn