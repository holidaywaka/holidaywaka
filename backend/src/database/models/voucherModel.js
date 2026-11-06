import { DataTypes } from "sequelize"
import { ModelIDFormat, MainStatusOptions } from "../../config/utilities.js"

function voucherModelFn (sequelize) {
    return sequelize.define('Voucher', {
        id: ModelIDFormat(DataTypes),
        code: DataTypes.STRING,
        discountType: DataTypes.STRING,
        discountValue: {type: DataTypes.FLOAT, defaultValue: 0},
        expirationDate: DataTypes.DATE,
        maxUsageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        currentUsageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        accountId: DataTypes.TEXT,
        service: DataTypes.STRING,
        status: { type: DataTypes.STRING, defaultValue: MainStatusOptions.true },
    })
}

export default voucherModelFn