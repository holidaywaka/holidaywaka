
import dotenv from "dotenv"
import { Op } from "sequelize"
import { getCache, setCache } from "../../../config/cacheConfig.js"
import { formatTransportNodeResponse, formatFindPlaceResponse, formatOfferPricingTransferResponse, formatFindSinglePlaceResponse, formatTransferOrder, formatOfferPricingChauffeurResponse } from "../services/iway-repo.js"
import { IwayPost, iwayApi, IwayGet, IwayPostCancel, USER_ID } from "../services/iwayConfig.js"
import { JOB_FILES, runJobs } from "../../../config/jobs-utils.js"
import { ServerError, JsonResponse, MarkupOptions, displayMarkupPercent, TransactionTypes, generateReference, PageOffset, ServerPagination, GetRateValue, NairaRate, IsNaira, ServerTransactionStatusOptions, iwayResponse, MainStatusOptions, ServerTransactionPaymentType, roundUpAmount } from "../../../config/utilities.js"
import dayjs from "dayjs"
import db from "../repository/transfers.repository.js"
import { createPayment } from "../../payments/services/createPayment.js"
import { MailKinds, sendTransactionMail } from "../../notifications/services/transaction-mail.js"

dotenv.config()

export const GetListsTransferNodes = async (req, res) => {
    try {
        const { term } = req.query
        if (!term) return JsonResponse(res, 404, { message: 'Provide a place to search' })

        const response = await IwayGet(iwayApi.transport_nodes, `&term=${term}&currency=USD`)
        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const formatted = formatTransportNodeResponse(response.result)

        // setCache(cachekey, formatted)
        return JsonResponse(res, 200, formatted)
    } catch (error) {
        ServerError(res, error)
    }
}

export const CheckBookableTime = async (req, res) => {
    try {
        const body = {
            price_id: req.body.price_id,
            user_id: USER_ID,
            pickup_time: req.body?.pickup_time || null,
            departure_time: req.body?.departure_time || null,
        }

        const response = await IwayPost(iwayApi.check_time, body)
        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        return JsonResponse(res, 200, { ...response.result, original: response })
    } catch (error) {
        ServerError(res, error)
    }
}

export const FindPlaces = async (req, res) => {
    try {
        // sample origin = Heathrow Airport
        // sample destination = Gatwick Airport South Terminal Long Stay Car Park
        const { term } = req.query
        if (!term) return JsonResponse(res, 404, { message: 'Provide a place to search' })
        const response = await IwayGet(iwayApi.find_places, `&term=${term}`)
        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })


        const formatted = formatFindPlaceResponse(response.result)

        return JsonResponse(res, 200, formatted)
    } catch (error) {
        ServerError(res, error)
    }
}

export const FindPlaceByID = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return JsonResponse(res, 404, { message: 'Provide a place by ID to search' })

        // const cachekey = `place${id}`
        // const cached = getCache(cachekey)
        // if (cached) return JsonResponse(res, 200, cached)

        const response = await IwayGet(`${iwayApi.single_place}/${id}`)
        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const formatted = formatFindSinglePlaceResponse(response.result)

        // setCache(cachekey, info)
        return JsonResponse(res, 200, formatted)
    } catch (error) {
        ServerError(res, error)
    }
}

export const TransferOfferPricing = async (req, res) => {
    try {
        const { start_lat, start_lon, finish_lat, finish_lon, currency } = req.body

        const cachekey = `${start_lat}${start_lon}${finish_lat}${finish_lon}`
        const cached = getCache(cachekey)
        if (cached) return JsonResponse(res, 200, cached)

        const [response, response2, response3] = await Promise.all([
            IwayGet(iwayApi.prices, `currency=USD&start_place_point=${start_lat},${start_lon}&finish_place_point=${finish_lat},${finish_lon}&platform=7`),
            db.Markups.findOne({ where: { tag: MarkupOptions.airport, status: MainStatusOptions.true } }),
            db.Rates.findOne({ where: { status: MainStatusOptions.true } })
        ])
        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        if (response?.result !== null && response.result?.length < 1) return JsonResponse(res, 200, [])

        const isNg = IsNaira(req, response3, currency)

        const formatted = formatOfferPricingTransferResponse(response.result)
        const results = formatted.map(ele => {
            const payable = response2 ? displayMarkupPercent(ele.alternative_price, response2.discountValue, 0) : ele.alternative_price
            return {
                payable: payable,
                charge: {
                    currency: isNg.currency,
                    rate: isNg.getRate.value,
                    amount: roundUpAmount(isNg.getRate.value ? payable * Number(isNg.getRate.value) : payable)
                },
                ...ele,
                additional_services: ele.additional_services.map(val => {
                    return {
                        ...val,
                        charge: {
                            currency: isNg.currency,
                            rate: isNg.getRate.value,
                            price: roundUpAmount(isNg.getRate.value ? val.price * Number(isNg.getRate.value) : val.price),
                        }
                    }
                })
            }
        });

        // setCache(cachekey, results)
        return JsonResponse(res, 200, results)
    } catch (error) {
        console.log(error, "ERROR")
        ServerError(res, error)
    }
}

export const ChauffeurServicePrice = async (req, res) => {
    try {
        // const cachekey = `chauffeur${req.body.start_lat}${req.body.start_lon}${req.body.place_id}`
        // const cached = getCache(cachekey)
        // if (cached) return JsonResponse(res, 200, cached)

        const { start_lat, start_lon, place_id, currency } = req.body
        const [response, response2, response3] = await Promise.all([
            IwayGet(iwayApi.price_rent, `currency=NGN&start_place_point=${start_lat},${start_lon}&place_id=${place_id}&platform=7`),
            db.Markups.findOne({ where: { tag: MarkupOptions.airport, status: MainStatusOptions.true } }),
            db.Rates.findOne({ where: { status: MainStatusOptions.true } })
        ])

        if (!response.status?.toString().startsWith("2")) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        if (response?.result !== null && response.result?.length < 1) return JsonResponse(res, 200, [])


        const isNg = IsNaira(req, response3, currency)

        const formatted = formatOfferPricingChauffeurResponse(response.result)

        const results = formatted?.map(ele => {
            const payable = response2 ? displayMarkupPercent(ele.alternative_price, response2.discountValue, 0) : ele.alternative_price
            return {
                payable: payable,
                charge: {
                    currency: isNg.currency,
                    rate: isNg.getRate.value,
                    amount: roundUpAmount(isNg.getRate.value ? payable * Number(isNg.getRate.value) : payable),
                    price_per_hour: roundUpAmount(isNg.getRate.value ? ele.price_per_hour * Number(isNg.getRate.value) : ele.price_per_hour),
                    delivery_costs: roundUpAmount(isNg.getRate.value ? ele.delivery_costs * Number(isNg.getRate.value) : ele.delivery_costs),
                },
                ...ele,
                additional_services: ele.additional_services?.map(val => {
                    return {
                        ...val,
                        charge: {
                            currency: isNg.currency,
                            rate: isNg.getRate.value,
                            price: roundUpAmount(isNg.getRate.value ? val.price * Number(isNg.getRate.value) : val.price),
                        }
                    }
                })
            }
        });

        // setCache(cachekey, results)
        return JsonResponse(res, 200, results)
    } catch (error) {
        ServerError(res, error, 'Error getting chauffeur pricing')
    }
}

export const CreateTripOrder = async (req, res) => {
    try {
        if (!req.body.currency) return JsonResponse(res, 404, { message: `Country's currency not provided` })
        if (!req.body.pickup_type) return JsonResponse(res, 404, { message: `Pickup type not provided` })
        if (Array.isArray(req.body.trip) && req.body.trip.length < 1) return JsonResponse(res, 404, { message: `Trip details not provided` })
        const { currency, payment_method } = req.body

        const trips = req.body.trip.map((ele) => {
            return {
                ...ele,
                "lang": "en",
                "user_id": USER_ID,
            }
        })

        const fields = {
            "lan": "en",
            "user_id": USER_ID,
            "trips": trips
        }


        // test order before connecting to iway
        const response = await IwayPost(iwayApi.orders, fields)

        if (response.status !== 200) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const transferOrder = response.result[0]
        const order_id = transferOrder.order_id;
        let payment;


        // create transaction minimal at the same time call the get single order from iway also get markup
        const [transaction, orderResponse, transfer, markup, rateResponse] = await Promise.all([
            db.Transactions.create({ txType: req.body.pickup_type, txid: generateReference(), paymentType: payment_method ? payment_method : ServerTransactionPaymentType.direct_bank_transfer, }),
            IwayGet(iwayApi.orders_trips, `&order_id=${order_id}`),
            db.Transfers.create({ order_id: transferOrder.order_id, pickup_type: req.body.pickup_type }),
            db.Markups.findOne({ where: { tag: MarkupOptions.airport, status: MainStatusOptions.true } }),
            db.Rates.findOne({ where: { status: MainStatusOptions.true } })
        ])

        // format the response from iway
        const order = formatTransferOrder(orderResponse.result.orders)

        const isNg = IsNaira(res, rateResponse, currency)
        const getPrice = order.reduce((acc, curr) => acc + Number(curr.price), 0)


        // update the transaction fully and update a transfer model at the same time
        const amount = markup?.id ? displayMarkupPercent(getPrice, markup?.discountValue, markup?.vat) : getPrice
        await Promise.all([
            transaction.update({
                transferId: transfer.id,
                amount: amount,
                charge: {
                    currency: isNg.currency,
                    amount: roundUpAmount(isNg.status ? amount * Number(isNg.getRate.value) : amount),
                    rate: isNg?.getRate.value || 0,
                    markup_value: markup?.id ? markup.discountValue : 0,
                    vat: markup?.id ? markup.vat : 0,
                },
            }),
            transfer.update({
                markup: `${markup?.discountValue || 0}%`,
                payable: amount,
                charge: {
                    currency: isNg.currency,
                    amount: roundUpAmount(isNg.status ? amount * Number(isNg.getRate.value) : amount),
                    rate: isNg?.getRate.value || 0,
                    markup_value: markup?.id ? markup.discountValue : 0,
                    vat: markup?.id ? markup.vat : 0,
                },
                trips: order,
            })
        ])
        // send mail to complete payment to user, and notify admin on new order alert

        const isUnifiedPayment = payment_method === ServerTransactionPaymentType.unified_payment_transfer;

        if (isUnifiedPayment) {
            payment = await createPayment({
                amount: transaction.charge.amount,
                // charge.amount is in the charged currency (NGN for Nigerian visitors)
                currency: transaction.charge.currency || currency,
                transactionId: transaction.id,
                description: `${transfer.pickup_type === TransactionTypes.chauffeur ? 'Chauffeur service' : 'Airport transfer'} ${order[0]?.bookingCode ?? ''}`.trim(),
                returnRoute: `verify-payment/${transaction.id}/${transaction.txType}`,
            })
            if (payment.status !== 200) throw new CustomError(500, payment.message)
            await transaction.update({
                orderId: payment.orderId,
                gatewayToken: payment.token,
            })
        }

        // Detailed order email (customer + admin copy), shared with every other service
        await sendTransactionMail(await transaction.reload(), MailKinds.received)

        return JsonResponse(res, 200, {
            data: transaction.txid,
            attachment: `?transaction_type=${transaction.txType}&transaction_id=${transaction.id}`,
            url: isUnifiedPayment ? payment.url : null
        });
    } catch (error) {
        ServerError(res, error, 'Error creating trip order')
    }
}

export const GetAllTransferOrders = async (req, res) => {
    try {
        const { p, page_size, search } = req.query

        const where = {
            trips: { [Op.ne]: null }
        }
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { payable_status: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { service_id: { [Op.like]: `%${search}%` } },
                { order_id: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Transfers.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'trips', 'charge', 'payable', 'markup', 'createdAt', 'updatedAt', 'order_id', 'pickup_type'],
            limit: perPage,
            offset,
            include: [
                { model: db.Transactions, where: { txType: [TransactionTypes.transfer, TransactionTypes.chauffeur] } }
            ]
        })

        const formatted = rows.map(b => ({
            ...b.toJSON(),
            Transactions: b.Transactions[0]?.toJSON(),
        }));

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `Transfer orders successfully retrieved`, data: formatted })
    } catch (error) {
        ServerError(res, error, 'Error getting all transfer orders')
    }
}

export const GetTransferInvoice = async (req, res) => {
    try {
        const transaction = await db.Transactions.findOne({
            where: { txid: req.params.id }, include: [
                { model: db.Transfers }
            ]
        })
        if (!transaction) return JsonResponse(res, 404, { message: 'Transaction not found' })

        const formatted = {
            ...transaction.toJSON(),
            Transfer: {
                ...transaction.Transfer.toJSON(),
            }
        }

        return JsonResponse(res, 200, formatted)
    } catch (error) {
        ServerError(res, error, 'Error getting transfer invoice')
    }
}

export const CheckCancellation = async (req, res) => {
    try {
        const order = await db.Transfers.findOne({ where: { order_id: req.body.order_id } })
        if (!order) return JsonResponse(res, 404, { message: 'Order not found' })

        // if (order.payable_status?.toLowerCase() === 'paid') return JsonResponse(res, 400, { message: 'Cannot check cancellation on a paid order' })
        const response = await IwayGet(`${iwayApi.orders_check_cancel}/${req.body.order_id}/check-cancel`)

        if (response.status !== 200) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const StatusOptions = [
            { title: `No penalty`, tag: 4 },
            { title: `Penalty applied`, tag: 5 },
        ]
        const statusTag = StatusOptions.find(ele => ele.tag === response.result.status)?.title
        return JsonResponse(res, 200, {
            message: 'Cancellation checked successfully',
            data: {
                status: statusTag,
                fine: response.result.fine
            },
            original: response
        })
    } catch (error) {
        ServerError(res, error, 'Error checking cancellation')
    }
}

export const CancelIwayOrder = async (req, res) => {
    try {
        const order = await db.Transfers.findOne({ where: { order_id: req.body.order_id } })
        if (!order) return JsonResponse(res, 404, { message: 'Order not found' })
        // if (order.payable_status?.toLowerCase() === 'paid') return JsonResponse(res, 400, { message: 'Cannot check cancellation on a paid order' })

        const orderResult = {
            ...order.toJSON(),
        }

        const orderData = orderResult.trips[0]
        const fields = {
            user_id: USER_ID,
            transaction: Number(orderData.transaction),
            order_id: Number(order.order_id),
        }
        const response = await IwayPostCancel(iwayApi.orders_trip_cancel, fields)
        if (response.status !== 200) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const result = await IwayGet(iwayApi.orders_trips, `&order_id=${order.order_id}`)

        if (result.result.orders?.length < 1) return JsonResponse(res, 200, [])

        const formatted = formatTransferOrder(result.result.orders)

        await order.update({ trips: formatted })

        return JsonResponse(res, 200, { message: 'Transaction cancelled successfully', original: response })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetOrderPaymentLink = async (req, res) => {
    try {
        const order = await db.Transfers.findOne({ where: { order_id: req.body.order_id } })
        if (!order) return JsonResponse(res, 404, { message: 'Order not found' })

        const response = await IwayGet(iwayApi.order_pay_url, `&transaction=${order.transaction}`)
        if (response.status !== 200) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        return JsonResponse(res, 200, { message: response.result?.url })
    } catch (error) {
        ServerError(res, error)
    }
}

export const VerifyOrderPayment = async (req, res) => {
    try {
        const orderResponse = await db.Transfers.findOne({ where: { order_id: req.body.order_id } })
        if (!orderResponse) return JsonResponse(res, 404, { message: 'Order not found' })

        const orderResult = {
            ...orderResponse.toJSON(),
        }

        const order = orderResult.trips[0]



        const response = await IwayPost(`${iwayApi.order_approve_transaction}/${order.transaction}`)
        if (response.status !== 200) return JsonResponse(res, response.status, { message: iwayResponse(response) })

        const result = await IwayGet(iwayApi.orders_trips, `&order_id=${order.order_id}`)

        if (result.result.orders?.length < 1) return JsonResponse(res, 200, [])

        const formatted = formatTransferOrder(result.result.orders)

        await orderResponse.update({ trips: formatted })

        return JsonResponse(res, 200, { message: 'Transaction verified successfully', original: response })
    } catch (error) {
        ServerError(res, error)
    }
}

export const ResyncOrder = async (req, res) => {
    try {

        const order = await db.Transfers.findOne({ where: { order_id: req.params.id } })
        if (!order) return JsonResponse(res, 404, { message: 'Order not found' })

        const result = await IwayGet(iwayApi.orders_trips, `&order_id=${order.order_id}`)

        if (result.result.orders?.length < 1) return JsonResponse(res, 404, { message: 'Request does not exists' })

        const formatted = result.result.orders.map(ele => {
            return formatTransferOrder(ele)
        })

        const itemOrder = formatted[0]
        await order.update({ ...itemOrder })

        return JsonResponse(res, 200, { message: 'Order re-synced successfully', order })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateTransferTransaction = async (req, res) => {
    try {
        const transaction = await db.Transactions.findOne({ where: { id: req.body.transactionID, transferId: req.body.transferID } })
        if (!transaction) return JsonResponse(res, 404, { message: `Transaction not found` })

        if (!Object.values(ServerTransactionStatusOptions).includes(req.body.paymentStatus)) return JsonResponse(res, 404, { message: `Invalid payment status supplied` })

        await transaction.update({ paymentStatus: req.body.paymentStatus, status: req.body.paymentStatus === ServerTransactionStatusOptions.paid ? 'CLOSE' : 'OPEN' })

        return JsonResponse(res, 200, { message: `Transaction updated` })
    } catch (error) {
        ServerError(res, error)
    }
}