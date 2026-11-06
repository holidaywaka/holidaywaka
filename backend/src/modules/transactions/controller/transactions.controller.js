import dayjs from 'dayjs'
import { UploadImage } from '../../../config/cloudinaryConfig.js'
import { PageOffset, ServerPagination, JsonResponse, ServerError, ServerTransactionStatusOptions, MainStatusOptions, USER_TYPES, ServerTransactionPaymentType, ServerTransactionMainStatus } from '../../../config/utilities.js'
import db from '../repository/transactions.repository.js'
import logger from '../../../middleware/logger.js'
import CustomError from '../../../middleware/custom-error.js'
import { Op } from 'sequelize'
import { verifyUpWebhook } from '../../payments/services/upConfig.js'
import { upChargeAmount } from '../../payments/services/createPayment.js'
import { applyManualPaymentStatus, markTransactionDeclined, markTransactionPaid, readUpStatus, syncUnifiedPayment } from '../../payments/services/payment-events.js'
import { isProduction } from '../../../config/dbConfig.js'



export const GetAllTransactions = async (req, res) => {
    try {
        const { p, page_size, search } = req.query
        let where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            [Op.or]: [
                { txType: { [Op.like]: `%${search}%` } },
                { txid: { [Op.like]: `%${search}%` } },
                { amount: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { paymentStatus: { [Op.like]: `%${search}%` } },
                { paymentType: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Transactions.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
            include: [
                { model: db.TransactionTimelines, attributes: ["paid", "datePaid", "balance"] }
            ]
        })

        const details = []
        for (const ele of rows) {
            details.push({
                ...ele.toJSON(),
                TransactionTimelines: ele.dataValues?.TransactionTimelines?.length
            })
        }

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `Transactions successfully retrieved`, data: details })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetSingleTransaction = async (req, res) => {
    try {
        const [item, bank] = await Promise.all([
            db.Transactions.findOne({ where: { id: req.params.id, txType: req.params.type } }),
            db.Banks.findOne({ where: { status: MainStatusOptions.true } })
        ])
        if (!item) return JsonResponse(res, 404, { message: 'Transaction not found' })

        const details = {
            transaction: {
                ...item.toJSON(),
            },
            account: bank
        }

        const details2 = {
            ...details,
            transaction: {
                ...details.transaction,
                charge: {
                    ...details.transaction.charge,
                    rate: parseFloat(details.transaction.charge.rate),
                    displayPrice: parseFloat((details.transaction.charge.amount / parseFloat(details.transaction.charge.rate)).toFixed(2))
                }
            }
        }

        return JsonResponse(res, 200, details2)
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllTransactionTimelines = async (req, res) => {
    try {
        const { txid } = req.params
        const item = await db.Transactions.findOne({
            where: { txid: txid },
            include: [
                { model: db.TransactionTimelines, attributes: ["paid", "datePaid", "balance", 'createdAt'] }
            ]
        })

        return JsonResponse(res, 200, item)
    } catch (error) {
        ServerError(res, error)
    }
}

export const UploadPaymentProof = async (req, res) => {
    try {
        const image = req?.files?.image
        if (!image) return JsonResponse(res, 404, { message: 'kindly upload screenshot of payment proof' })

        const item = await db.Transactions.findOne({ where: { id: req.body.transaction_id, txType: req.body.transaction_type } })
        if (!item) return JsonResponse(res, 404, { message: `Transaction not found` })

        if (item.image) return JsonResponse(res, 400, { message: 'Payment slip already uploaded' })


        const file = await UploadImage(image)
        if (file.status !== 200) return JsonResponse(res, file.status, { message: file.message })

        await item.update({ image: file.media, paymentStatus: ServerTransactionStatusOptions.submitted })

        return JsonResponse(res, 200, { message: `Payment slip successfully uploaded` })
    } catch (error) {
        ServerError(res, error)
    }
}

export const VerifySingleTransaction = async (req, res) => {
    try {
        const item = await db.Transactions.findOne({ where: { id: req.params.id, txType: req.params.type } });
        if (!item) return JsonResponse(res, 404, { message: 'Transaction not found' });

        // Unified Payment checkout: ask the gateway for the real status (also covers a missed webhook)
        let payment = null
        if (item.paymentType === ServerTransactionPaymentType.unified_payment_transfer && item.paymentStatus !== ServerTransactionStatusOptions.paid) {
            try {
                const result = await syncUnifiedPayment(item, 'verify page')
                payment = { state: result.state, status: result.status ?? null, reason: result.reason ?? null }
            } catch (error) {
                logger.warn(`[payments] verify ${item.id}: ${error.message}`)
                payment = { state: 'unknown', status: null, reason: 'Unable to reach the payment gateway right now' }
            }
        }

        const booking = item.hotelBookingId ? await db.HotelBookings.findByPk(item.hotelBookingId, { attributes: ['id', 'reference', 'status'] }) : null
        return JsonResponse(res, 200, {
            payment,
            transaction: item.toJSON(),
            ...(booking ? { booking: { id: booking.id, reference: booking.reference, status: booking.status } } : {}),
        })
    } catch (error) {
        ServerError(res, error)
    }
}

/**
 * Unified Payment / Payloft payment notification (callbackUrl). The v1.1 guide does not document the body, so it is
 * matched by Token, then "Order Id", then our merchantRefData, whether flat or wrapped in { data }.
 * The gateway's status query is the source of truth. Only if it can't be reached is the verified
 * notification itself applied, and an approval only when its amount matches what we charged.
 */
export const UpPaymentWebhook = async (req, res) => {
    try {
        const body = req.body ?? {}
        const verified = verifyUpWebhook({ rawBody: req.rawBody, apiKey: req.get('x-api-key'), signature: req.get('x-payloft-signature') })
        if (!verified) {
            logger.warn(`[payments] Unified Payment notification rejected: invalid signature / api key`)
            return JsonResponse(res, 401, { message: 'Webhook verification failed' })
        }

        const data = body.data && typeof body.data === 'object' ? body.data : body
        const token = data.Token ?? data.token ?? null
        const orderId = data['Order Id'] ?? data.OrderId ?? data.id ?? null
        // merchantRefData is ours (a transaction UUID), only a fallback
        const referenceId = data.merchantRefData ?? data.MerchantRefData ?? null

        let transaction = null
        if (token) transaction = await db.Transactions.findOne({ where: { gatewayToken: String(token) } })
        if (!transaction && orderId !== null) transaction = await db.Transactions.findOne({ where: { orderId: String(orderId) } })
        if (!transaction && referenceId && /^[0-9a-f-]{36}$/i.test(String(referenceId))) transaction = await db.Transactions.findByPk(String(referenceId))

        if (!transaction) {
            logger.warn(`[payments] Unified Payment notification for unknown transaction (token ${token}, order ${orderId}, reference ${referenceId})`)
            // 200 stops the gateway retrying a notification we can never match
            return JsonResponse(res, 200, { message: 'Ignored: transaction not found' })
        }

        try {
            const result = await syncUnifiedPayment(transaction, 'webhook')
            logger.info(`[payments] ${req.get('x-webhook-event') ?? body.event ?? 'callback'} for ${transaction.id}: gateway status ${result.status} -> ${result.state}`)
            return JsonResponse(res, 200, { message: 'Webhook processed', state: result.state })
        } catch (error) {
            logger.warn(`[payments] status API unavailable for ${transaction.id} (${error.message}); applying the verified notification`)
        }

        const result = readUpStatus(data)
        const notifiedAmount = Number(data.Amount ?? data.amount)
        const chargedAmount = upChargeAmount(transaction.charge?.amount ?? transaction.amount)
        await transaction.update({ gatewayResponse: body, gatewayStatus: result.status || null })

        if (result.state === 'paid') {
            if (!(Math.abs(notifiedAmount - chargedAmount) < 0.01)) {
                logger.error(`[payments] approval for ${transaction.id} ignored: notified ${notifiedAmount}, charged ${chargedAmount}`)
                return JsonResponse(res, 200, { message: 'Amount mismatch: left for manual review' })
            }
            await markTransactionPaid(transaction, { source: 'verified webhook' })
        } else if (result.state === 'declined') {
            await markTransactionDeclined(transaction, { reason: result.reason, source: 'verified webhook' })
        }
        return JsonResponse(res, 200, { message: 'Webhook processed', state: result.state })
    } catch (error) {
        logger.error(`[payments] Unified Payment webhook failed: ${error.message}`)
        // Non-2xx makes the gateway retry later
        return JsonResponse(res, 502, { message: 'Webhook could not be processed, please retry' })
    }
}

/** Admin: set a transaction's payment status (bank transfers, part payments, declines) for any service */
export const UpdateTransactionPaymentStatus = async (req, res) => {
    try {
        const transaction = await db.Transactions.findByPk(req.params.id)
        if (!transaction) return JsonResponse(res, 404, { message: 'Transaction not found' })

        const previous = transaction.paymentStatus
        await applyManualPaymentStatus(transaction, req.body)
        await transaction.reload()
        await db.Notifies.create({
            userId: req.user.id,
            title: 'Transaction payment status updated',
            content: `${transaction.txType} transaction ${transaction.txid} changed from ${previous} to ${transaction.paymentStatus}`,
        })
        return JsonResponse(res, 200, { message: `Payment status set to ${transaction.paymentStatus}`, data: transaction })
    } catch (error) {
        ServerError(res, error)
    }
}
