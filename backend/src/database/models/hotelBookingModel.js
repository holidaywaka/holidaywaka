import { DataTypes } from "sequelize"
import { ModelIDFormat } from "../../config/utilities.js"
import { jsonColumn } from "./hotelModelUtils.js"

/**
 * Lifecycle of a hotel order (steps 4 and 5 of the ETG flow):
 *
 *   awaiting_payment -> (paid) -> booking -> confirmed -> cancelled
 *                    -> payment_declined      \-> failed (after payment: refund needed)
 *                                              \-> needs_attention (price rose since payment / manual review)
 *
 * The guest pays us first; the ETG booking (form -> finish -> status) only starts once the payment is confirmed.
 */
export const HotelBookingStatus = {
    awaiting_payment: "awaiting_payment",
    payment_declined: "payment_declined",
    booking: "booking",
    confirmed: "confirmed",
    failed: "failed",
    needs_attention: "needs_attention",
    cancelled: "cancelled",
}

function hotelBookingModelFn(sequelize) {
    return sequelize.define("HotelBookings", {
        id: ModelIDFormat(DataTypes),
        reference: DataTypes.STRING(32),
        transactionId: DataTypes.UUID,
        prebookId: DataTypes.UUID,
        hid: DataTypes.BIGINT,
        hotelName: DataTypes.STRING,
        hotelAddress: DataTypes.STRING,
        regionName: DataTypes.STRING,

        status: { type: DataTypes.STRING(32), defaultValue: HotelBookingStatus.awaiting_payment },
        // Last raw ETG status / error code, and a human-readable reason for failures
        etgStatus: DataTypes.STRING(64),
        failureReason: DataTypes.TEXT,

        // ETG identifiers. A new partner_order_id is used for every booking-form retry.
        partnerOrderId: DataTypes.STRING(64),
        partnerOrderIds: jsonColumn(DataTypes, "partnerOrderIds", []),
        etgOrderId: DataTypes.BIGINT,
        etgItemId: DataTypes.BIGINT,
        bookHash: DataTypes.STRING(256),
        hotelConfirmationNumber: DataTypes.STRING(128),
        supplierConfirmationId: DataTypes.STRING(128),

        // Stay as searched (must match ETG exactly at booking)
        checkin: DataTypes.DATEONLY,
        checkout: DataTypes.DATEONLY,
        residency: DataTypes.STRING(2),
        guests: jsonColumn(DataTypes, "guests", []),
        // Guest names per room: [{ guests: [{ first_name, last_name, is_child, age }] }]
        rooms: jsonColumn(DataTypes, "rooms", []),
        roomName: DataTypes.STRING,
        mealLabel: DataTypes.STRING,
        rate: jsonColumn(DataTypes, "rate", null),
        freeCancellationBefore: DataTypes.DATE,

        // Lead guest / contact
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING(40),
        comment: DataTypes.TEXT,
        // End-user IP, required by ETG's booking form
        userIp: DataTypes.STRING(64),

        // Selling side (what the guest pays us) and supplier side (what ETG charges us)
        amount: DataTypes.DECIMAL(14, 2),
        discount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        currency: DataTypes.STRING(3),
        netAmount: DataTypes.DECIMAL(14, 2),
        netCurrency: DataTypes.STRING(3),
        contractAmount: DataTypes.DECIMAL(14, 2),
        contractCurrency: DataTypes.STRING(3),
        exchangeRate: { type: DataTypes.DECIMAL(14, 4), defaultValue: 1 },
        markup: jsonColumn(DataTypes, "markup", null),
        etgPaymentType: DataTypes.STRING(16),
        voucherCode: DataTypes.STRING(64),

        // Post-booking
        cancellation: jsonColumn(DataTypes, "cancellation", null),
        orderInfo: jsonColumn(DataTypes, "orderInfo", null),

        bookingStartedAt: DataTypes.DATE,
        statusCheckedAt: DataTypes.DATE,
        confirmedAt: DataTypes.DATE,
        failedAt: DataTypes.DATE,
        cancelledAt: DataTypes.DATE,
        // Compact audit trail: [{ at, event, detail }]
        events: jsonColumn(DataTypes, "events", []),
    }, {
        indexes: [
            { fields: ["status"] },
            { fields: ["partnerOrderId"] },
            { fields: ["transactionId"] },
            { fields: ["reference"] },
        ]
    })
}

export default hotelBookingModelFn
