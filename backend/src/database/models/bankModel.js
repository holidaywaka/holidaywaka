import { DataTypes } from "sequelize";
import { MainStatusOptions } from "../../config/utilities.js";


function bankModelFn(sequelize) {
    return sequelize.define("Bank", {
        accountName: DataTypes.STRING,
        accountNumber: DataTypes.STRING,
        bankName: DataTypes.STRING,
        status: {type: DataTypes.STRING, defaultValue: MainStatusOptions.true},
    })
}

export default bankModelFn