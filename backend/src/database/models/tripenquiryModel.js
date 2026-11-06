import { DataTypes } from "sequelize";
import { dbStringToJson, ModelIDFormat, ReferenceModelFormat } from "../../config/utilities.js"

function tripEnquiryModelFn(sequelize) {
    const TripEnquiry = sequelize.define('TripEnquiry', {
        id: ModelIDFormat(DataTypes),
        userId: DataTypes.UUID,
        tripId: DataTypes.UUID,
        travelDate: DataTypes.STRING,
        message: DataTypes.STRING,
        status: DataTypes.STRING,
        tripType: DataTypes.STRING,
        travelers: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('travelers'))
            }
        },
        totalPrice: DataTypes.FLOAT,
    });

    return TripEnquiry;
};


export default tripEnquiryModelFn