
import { DataTypes } from "sequelize"
import { dbStringToJson, ModelIDFormat, VisaStatusEnums } from "../../config/utilities.js"

function visaEnquiryModelFn(sequelize) {
    return sequelize.define('VisaEnquiry', {
        id: ModelIDFormat(DataTypes),
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        nationality: DataTypes.STRING,
        visa: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('visa'))
            }
        }, // visa type, price, requirement, visa-country
        hasPassport: DataTypes.STRING,
        passportNumber: DataTypes.STRING,
        travelDate: DataTypes.DATE,
        message: DataTypes.TEXT,
        status: {
            type: DataTypes.STRING,
            defaultValue: VisaStatusEnums.pending
        }
    })
}

export default visaEnquiryModelFn
// visa = country, paymentType, price, requirement, visaType, fee, amount, paymentStatus