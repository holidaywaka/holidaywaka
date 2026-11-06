// Unified Payment v1.1 identifies an order by a token (payment page + status query); orderId keeps the numeric id
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Transactions", "gatewayToken", { type: Sequelize.STRING })
        await queryInterface.addIndex("Transactions", ["gatewayToken"], { name: "transactions_gateway_token" })
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("Transactions", "transactions_gateway_token")
        await queryInterface.removeColumn("Transactions", "gatewayToken")
    },
}
