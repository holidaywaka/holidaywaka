import { DataTypes } from "sequelize"
import { ModelIDFormat, ReferenceModelFormat, MainStatusOptions } from "../../config/utilities.js"

function voucherLogModelFn(sequelize) {
    return sequelize.define('VoucherLog', {
        id: ModelIDFormat(DataTypes),
        voucherID: DataTypes.UUID,
        memberId: DataTypes.UUID,
        email: DataTypes.STRING,
        status: {type: DataTypes.STRING, defaultValue: MainStatusOptions.true},
        date: DataTypes.DATE,
        expiry: DataTypes.DATE,
        discountValueText: DataTypes.STRING,
        discountTypeText: DataTypes.STRING,
        discountType: DataTypes.STRING,
        discountedValue: DataTypes.FLOAT,
        priceCharge: DataTypes.FLOAT,
        transactionId: DataTypes.UUID,
    })
}

export default voucherLogModelFn