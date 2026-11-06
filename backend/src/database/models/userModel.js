import { DataTypes } from "sequelize"
import { ModelIDFormat, USER_TYPES, MainStatusOptions } from "../../config/utilities.js"


function userModelFn (sequelize) {
    return sequelize.define('User', {
        id: ModelIDFormat(DataTypes),
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        dialCode: DataTypes.STRING,
        password: DataTypes.STRING,
        otpExpiry: DataTypes.DATE,
        otp: DataTypes.STRING,
        emailVerified: {type: DataTypes.STRING, defaultValue: MainStatusOptions.false},
        role: {type: DataTypes.STRING, defaultValue: USER_TYPES.user},
    })
}

export default userModelFn