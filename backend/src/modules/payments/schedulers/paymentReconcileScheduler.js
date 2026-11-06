import cron from "node-cron"
import dayjs from "dayjs"
import { Op } from "sequelize"
import db from "../repository/payments.repository.js"
import logger from "../../../middleware/logger.js"
import { ServerTransactionPaymentType, ServerTransactionStatusOptions } from "../../../config/utilities.js"
import { syncUnifiedPayment } from "../services/payment-events.js"
import { resumeInterruptedBookings } from "../../hotels/services/hotel-booking.service.js"

const RECONCILE_WINDOW_HOURS = 48

/** Card payments still open from the last 48h are re-checked with Unified Payment (covers missed webhooks) */
async function reconcileCardPayments() {
    const open = await db.Transactions.findAll({
        where: {
            paymentType: ServerTransactionPaymentType.unified_payment_transfer,
            paymentStatus: ServerTransactionStatusOptions.pending,
            gatewayToken: { [Op.ne]: null },
            createdAt: { [Op.gte]: dayjs().subtract(RECONCILE_WINDOW_HOURS, "hour").toDate() },
        },
        limit: 50,
    })
    for (const transaction of open) {
        try {
            await syncUnifiedPayment(transaction, "reconciliation")
        } catch (error) {
            logger.warn(`[payments] reconcile ${transaction.id}: ${error.message}`)
        }
    }
}

function PaymentReconcileScheduler() {
    // Hotel bookings interrupted by a restart keep processing at ETG; resume polling them
    db.ready
        .then(() => resumeInterruptedBookings())
        .then((count) => count && logger.info(`[hotel-booking] resumed ${count} booking(s) after restart`))
        .catch((error) => logger.error(`[hotel-booking] resume failed: ${error.message}`))

    cron.schedule("* * * * *", () => {
        resumeInterruptedBookings().catch((error) => logger.error(`[hotel-booking] resume failed: ${error.message}`))
    })

    cron.schedule("*/10 * * * *", () => {
        reconcileCardPayments().catch((error) => logger.error(`[payments] reconciliation failed: ${error.message}`))
    })
}

export default PaymentReconcileScheduler
