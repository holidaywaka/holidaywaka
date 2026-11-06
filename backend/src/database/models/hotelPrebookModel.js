import { DataTypes } from "sequelize"
import { ModelIDFormat } from "../../config/utilities.js"
import { jsonColumn } from "./hotelModelUtils.js"

// Result of a successful prebook (step 3). The stored `bookHash` is what the
// booking step (order/booking/form) must use; it may differ from `requestedHash`.
function hotelPrebookModelFn(sequelize) {
    return sequelize.define("HotelPrebooks", {
        id: ModelIDFormat(DataTypes),
        hid: DataTypes.BIGINT,
        hotelName: DataTypes.STRING,
        requestedHash: DataTypes.STRING(256),
        bookHash: DataTypes.STRING(256),
        priceIncreasePercent: { type: DataTypes.INTEGER, defaultValue: 0 },
        priceChanged: { type: DataTypes.BOOLEAN, defaultValue: false },
        originalAmount: DataTypes.DECIMAL(14, 2),
        // Selling price shown to the guest (markup + VAT applied, converted for Nigerian viewers)
        amount: DataTypes.DECIMAL(14, 2),
        currency: DataTypes.STRING(3),
        // Supplier (ETG) price and the pricing inputs used, kept for reconciliation
        netAmount: DataTypes.DECIMAL(14, 2),
        netCurrency: DataTypes.STRING(3),
        // ETG contract amount/currency (what the booking form charges us); compared at booking time
        contractAmount: DataTypes.DECIMAL(14, 2),
        contractCurrency: DataTypes.STRING(3),
        exchangeRate: { type: DataTypes.DECIMAL(14, 4), defaultValue: 1 },
        markup: jsonColumn(DataTypes, "markup", null),
        checkin: DataTypes.DATEONLY,
        checkout: DataTypes.DATEONLY,
        residency: DataTypes.STRING(2),
        guests: jsonColumn(DataTypes, "guests", []),
        rate: jsonColumn(DataTypes, "rate", null),
        expiresAt: DataTypes.DATE,
    }, {
        indexes: [
            { fields: ["bookHash"] },
        ]
    })
}

export default hotelPrebookModelFn
