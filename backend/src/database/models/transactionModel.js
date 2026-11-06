import { DataTypes } from "sequelize"
import { ModelIDFormat, ReferenceModelFormat, ServerTransactionPaymentType, ServerTransactionStatusOptions, ServerTransactionMainStatus, dbStringToJson } from "../../config/utilities.js"


function transactionModelFn(sequelize) {
    return sequelize.define('Transaction', {
        id: ModelIDFormat(DataTypes),
        userId: DataTypes.UUID,
        tripId: DataTypes.UUID,
        transferId: DataTypes.UUID,
        visaId: DataTypes.UUID,
        hotelBookingId: DataTypes.UUID,
        isVoucher: DataTypes.UUID,
        // userId: ReferenceModelFormat(DataTypes, "Users"),
        // tripId: ReferenceModelFormat(DataTypes, "TripEnquiries"),
        // transferId: ReferenceModelFormat(DataTypes, 'Transfers'),
        // visaId: ReferenceModelFormat(DataTypes, "VisaEnquiries"),
        // isVoucher: ReferenceModelFormat(DataTypes, 'VoucherLogs'),
        txType: DataTypes.TEXT,
        txid: DataTypes.TEXT,
        image: DataTypes.TEXT,
        amount: DataTypes.DOUBLE,
        charge: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('charge'))
            }
        },
        orderId: DataTypes.STRING,
        // Unified Payment order token: payment page and status queries use it
        gatewayToken: DataTypes.STRING,
        declineReason: DataTypes.TEXT,
        // Discount from a voucher code (in the charged currency), applied before payment
        discount: { type: DataTypes.DOUBLE, defaultValue: 0 },
        voucherCode: DataTypes.STRING,
        // Set once the paid/declined notifications have gone out, so webhook + verify never double-send
        notifiedStatus: DataTypes.STRING,
        // Exact JSON from the gateway's status query (Unified Payment requires keeping it for disputes)
        gatewayResponse: {
            type: DataTypes.JSON,
            get() {
                return dbStringToJson(this.getDataValue('gatewayResponse'))
            }
        },
        gatewayStatus: DataTypes.STRING,
        status: { type: DataTypes.STRING, defaultValue: ServerTransactionMainStatus.open },
        paymentStatus: { type: DataTypes.STRING, defaultValue: ServerTransactionStatusOptions.pending },
        paymentType: { type: DataTypes.STRING, defaultValue: ServerTransactionPaymentType.direct_bank_transfer },
    })
}

export default transactionModelFn