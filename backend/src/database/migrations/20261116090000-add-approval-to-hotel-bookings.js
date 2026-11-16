// Admin approval gate for hotel bookings. A confirmed payment approves a booking automatically;
// admins can also approve (confirm payment and book) or unapprove (decline / cancel with the hotel).
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("HotelBookings", "approved", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false })
        await queryInterface.addColumn("HotelBookings", "approvedAt", { type: Sequelize.DATE, allowNull: true })
        // "payment" when approved automatically, otherwise the admin's name/email
        await queryInterface.addColumn("HotelBookings", "approvedBy", { type: Sequelize.STRING(128), allowNull: true })
        await queryInterface.addIndex("HotelBookings", ["approved"], { name: "hotel_bookings_approved" })

        // Bookings already paid for count as approved
        await queryInterface.sequelize.query(`
            UPDATE HotelBookings hb
            JOIN Transactions t ON t.id = hb.transactionId
            SET hb.approved = true, hb.approvedAt = COALESCE(hb.confirmedAt, hb.bookingStartedAt, hb.updatedAt), hb.approvedBy = 'payment'
            WHERE t.paymentStatus = 'PAID' AND hb.status NOT IN ('cancelled', 'payment_declined')
        `)
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("HotelBookings", "hotel_bookings_approved")
        await queryInterface.removeColumn("HotelBookings", "approvedBy")
        await queryInterface.removeColumn("HotelBookings", "approvedAt")
        await queryInterface.removeColumn("HotelBookings", "approved")
    },
}
