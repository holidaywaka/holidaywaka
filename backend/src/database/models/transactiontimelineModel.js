import { DataTypes } from "sequelize"
import { ModelIDFormat, ReferenceModelFormat } from "../../config/utilities.js"


function transactionTimelineModelFn (sequelize) {
    return sequelize.define('TransactionTimeline', {
        id: ModelIDFormat(DataTypes),
        transactionId: DataTypes.UUID,
        // transactionId: ReferenceModelFormat(DataTypes, "Transactions"),
        paid: DataTypes.DOUBLE,
        balance: DataTypes.DOUBLE,
        datePaid: DataTypes.DATE,
    })
}

export default transactionTimelineModelFn