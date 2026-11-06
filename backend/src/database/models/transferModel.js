import { DataTypes } from "sequelize"
import { dbStringToJson, ModelIDFormat } from "../../config/utilities.js"

function transferModelFn(sequelize) {
    return sequelize.define("Transfer", {
        id: ModelIDFormat(DataTypes),
        trips: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('trips'))
            }
        },
        date_change: DataTypes.STRING,
        pickup_type: DataTypes.STRING,
        date: DataTypes.STRING,
        date_arrival: DataTypes.STRING,
        user_id: DataTypes.STRING,
        order_id: DataTypes.STRING,
        order_type: DataTypes.STRING,
        transaction: DataTypes.STRING,
        payable_status: DataTypes.STRING, //
        status: DataTypes.STRING, //
        ex_order_status: DataTypes.STRING, //
        charge: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('charge'))
            }
        }, // from our system if no charge default to payable
        payable: DataTypes.STRING, // from our system
        markup: DataTypes.STRING, // from our system
        bookingCode: DataTypes.STRING,
        allowable_booking_time: DataTypes.STRING,
        cancellation_time: DataTypes.STRING,
        currency: DataTypes.STRING,
        price_id: DataTypes.FLOAT,
        price: DataTypes.FLOAT,
        car_title: DataTypes.STRING,
        car_capacity: DataTypes.STRING,
        car_models: DataTypes.STRING,
        car_photo: DataTypes.STRING,
        car_class_id: DataTypes.FLOAT,
        passengers: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('passengers'))
            }
        },
        total_adults: DataTypes.FLOAT,
        total_children: DataTypes.FLOAT,
        coordinator_name: DataTypes.STRING,
        coordinator_phone: DataTypes.STRING,
        additional_services: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('additional_services'))
            }
        },
        viewers: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('viewers'))
            }
        },
        driver_data: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('driver_data'))
            }
        },
        service_provider: DataTypes.STRING,
        fare_on_toll_road: DataTypes.STRING,
        service_id: DataTypes.STRING,
        cancellation_time_without_penalty: DataTypes.STRING,
        origin: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('origin'))
            }
        },
        destination: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('destination'))
            }
        },
        duration: DataTypes.INTEGER,
        flexible_tariff: DataTypes.STRING,
        is_fast_ride: DataTypes.STRING,
        flexible_tariff_agreement: DataTypes.STRING
    })
}

export default transferModelFn