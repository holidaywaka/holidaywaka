import { Op } from 'sequelize'
import { UploadImage, DeleteImage, uploadMultipleImages } from '../../../config/cloudinaryConfig.js'
import { ServerError, PageOffset, ServerPagination, generateReference, JsonResponse, USER_TYPES, ServerTransactionStatusOptions, TransactionTypes, NairaRate, ServerNaira, VoucherStatusOptions, IsNaira, roundDecimal, roundUpAmount, ServerSlugify, MainStatusOptions, CalculateVoucherDiscounts, ServerTransactionPaymentType, MarkupOptions, displayMarkupPercent } from '../../../config/utilities.js'
import path from 'path'
import dayjs from "dayjs"

import SendMail from '../../../emails/emailConfig.js'
import db from '../repository/trips.repository.js'
import { runJobs, JOB_FILES } from '../../../config/jobs-utils.js'
import { cacheKeys, deleteCache, getCache, setCache } from '../../../config/cacheConfig.js'
import { createPayment } from '../../payments/services/createPayment.js'
import CustomError from '../../../middleware/custom-error.js'
import { applyManualPaymentStatus } from '../../payments/services/payment-events.js'
import { MailKinds, sendTransactionMail } from '../../notifications/services/transaction-mail.js'
import { reserveVoucher } from '../../vouchers/services/voucher.service.js'
import { assertVisaLeadTime, earliestTravelDate, quotePackage } from '../services/package-pricing.js'
// https://dev.holidaywaka.com/verify-payment?trxId=24571565&status=APPROVED&approved=True

export const CreateNewTrips = async (req, res) => {
    try {
        const getimages = req?.files?.images
        // if (!getimages) return JsonResponse(res, 404, { message: `Upload a minimum of one image` })


        // save trip images
        const images = []
        if (getimages) {
            const imagesResponse = await uploadMultipleImages(req.files?.images)
            imagesResponse.map(ele => {
                return images.push(ele)
            })
        }

        const slug = ServerSlugify(req.body.title)
        const newTrip = await db.Trips.create({
            ...req.body,
            visaRequired: Boolean(req.body.visaRequired),
            visaProcessingDays: req.body.visaRequired ? Math.max(0, parseInt(req.body.visaProcessingDays, 10) || 0) : 0,
            status: MainStatusOptions.true,
            slug,
        })


        await newTrip.update({
            images: images
        })
        await db.Notifies.create({
            userId: req.user.id,
            title: 'New Package Trip',
            content: `A new package trip with the title ${req.body.title} has been created`
        })

        deleteCache(cacheKeys.trips)
        deleteCache(cacheKeys.trip_filters)
        return JsonResponse(res, 201, {
            message: 'Trip created successfully',
            data: {
                id: newTrip.id
            }
        })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateTripInfo = async (req, res) => {
    try {
        const item = await db.Trips.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Trip not found' })

        // if new images are added. Copy first: pushing into the getter's array mutates the value Sequelize
        // compares against, so the change goes undetected and the new uploads are never saved
        const allNormalImages = [...(item.images ?? [])]
        if (req?.files?.images) {

            const imagesResponse = await uploadMultipleImages(req.files?.images)
            imagesResponse.map(ele => {
                return allNormalImages.push(ele)
            })
        }


        await item.update({
            status: req.body?.status || item.status,
            title: req.body?.title || item.title,
            startDate: req.body?.startDate || item.startDate,
            endDate: req.body?.endDate || item.endDate,
            summary: req.body?.summary || item.summary,
            tripType: req.body?.tripType || item.tripType,
            description: req.body?.description || item.description,
            itineraries: req.body?.itineraries || item.itineraries,
            inclusions: req.body?.inclusions || item.inclusions,
            destinations: req.body?.destinations || item.destinations,
            prices: req.body?.prices || item.prices,
            visaRequired: req.body?.visaRequired !== undefined ? Boolean(req.body.visaRequired) : item.visaRequired,
            visaProcessingDays: req.body?.visaProcessingDays !== undefined ? Math.max(0, parseInt(req.body.visaProcessingDays, 10) || 0) : item.visaProcessingDays,
            slug: req.body?.title ? ServerSlugify(req.body.title) : item.slug,
            images: allNormalImages
        });


        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update on Package Trip',
            content: `A package trip with the title ${item.title} has been updated`
        })

        deleteCache(cacheKeys.trips)
        deleteCache(cacheKeys.trip_filters)
        return JsonResponse(res, 200, { message: `Package successfully updated`, data: item })

    } catch (error) {
        ServerError(res, error)
    }
}

export const DeleteTripMedia = async (req, res) => {
    try {
        const trip = await db.Trips.findOne({
            where: { id: req.params.id }
        })
        if (!trip) return JsonResponse(res, 404, { message: `Trip not found` })

        const imageJson = trip.images
        const getImage = imageJson.find(ele => ele === req.body.url)
        if (!getImage) return JsonResponse(res, 404, { message: 'Requested image not found' })

        const result = await DeleteImage(getImage)
        const filterImage = imageJson.filter(ele => ele !== req.body.url)
        await trip.update({
            images: filterImage
        })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Delete a Package Trip Image',
            content: `The image of a package trip with the title ${trip.title} has been deleted`
        })

        deleteCache(cacheKeys.trips)
        deleteCache(cacheKeys.trip_filters)
        return JsonResponse(res, 200, { message: 'Image successfully deleted' })
    } catch (error) {
        ServerError(res, error)
    }
}

/**
 * Public package listing. Destinations and prices are JSON columns and the catalogue is small,
 * so filters run in memory over the active trips; only the unfiltered first page is cached.
 * Query: search, tripType, country, city, minPrice, maxPrice (NGN, lowest price per person),
 * startMonth/endMonth (month names; startDate/endDate accepted for older links), p, page_size.
 */
export const GetAllTrips = async (req, res) => {
    try {
        const { p, page_size, search, tripType, country, city } = req.query;
        const startMonth = req.query.startMonth ?? req.query.startDate
        const endMonth = req.query.endMonth ?? req.query.endDate
        const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null
        const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null
        const isFiltered = [search, tripType, country, city, startMonth, endMonth, req.query.minPrice, req.query.maxPrice].some((value) => value !== undefined && String(value).trim() !== '')

        const { perPage, offset, page } = PageOffset({ page_size, p: isFiltered ? (p ?? 1) : p })
        const cacheKey = `${cacheKeys.trips}:${page}:${perPage}`
        if (!isFiltered) {
            const isCached = getCache(cacheKey)
            if (isCached) return JsonResponse(res, 200, isCached)
        }

        const trips = await db.Trips.findAll({ where: { status: MainStatusOptions.true }, order: [['createdAt', 'DESC']] })
        const term = search?.trim().toLowerCase()
        const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
        const lowestPrice = (trip) => Math.min(...(trip.prices ?? []).map((item) => Number(item.price)).filter((value) => Number.isFinite(value)))

        const filtered = trips.filter((trip) => {
            const destinations = trip.destinations ?? []
            if (term && ![trip.title, trip.summary, trip.description, ...destinations.flatMap((item) => [item.country, item.city])].some((value) => String(value ?? '').toLowerCase().includes(term))) return false
            if (tripType && !same(trip.tripType, tripType)) return false
            if (country && !destinations.some((item) => same(item.country, country))) return false
            if (city && !destinations.some((item) => same(item.city, city))) return false
            if (startMonth && !same(dayjs(trip.startDate).format('MMMM'), startMonth)) return false
            if (endMonth && !same(dayjs(trip.endDate).format('MMMM'), endMonth)) return false
            const lowest = lowestPrice(trip)
            if (minPrice !== null && Number.isFinite(minPrice) && !(lowest >= minPrice)) return false
            if (maxPrice !== null && Number.isFinite(maxPrice) && !(lowest <= maxPrice)) return false
            return true
        })

        const pagination = ServerPagination({ page, perPage, count: filtered.length });
        const sendResponse = {
            ...pagination,
            message: `Trips successfully retrieved`,
            data: filtered.slice(offset, offset + perPage),
        }

        if (!isFiltered) setCache(cacheKey, sendResponse)
        return JsonResponse(res, 200, sendResponse);
    } catch (error) {
        ServerError(res, error, 'error getting all trips');
    }
};

export const AdminGetAllTrips = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query;

        let where = {};

        // Search filter
        if (search !== undefined && search?.trim() !== '') {
            where = {
                ...where,
                [Op.or]: [
                    { title: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                ]
            };
        }
        if (req.query.status !== undefined) {
            where = { ...where, status: req.query.status }
        }
        if (req.query.startDate !== undefined) {
            where = { ...where, startDate: { [Op.gte]: req.query.startDate } }
        }
        if (req.query.endDate !== undefined) {
            where = { ...where, endDate: { [Op.lte]: req.query.endDate } }
        }
        if (req.query.tripType !== undefined) {
            where = { ...where, tripType: { [Op.like]: `%${req.query.tripType}%` } }
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })

        const { rows, count } = await db.Trips.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        });

        const pagination = ServerPagination({ page, perPage, count });

        return JsonResponse(res, 200, {
            ...pagination,
            message: `Trips successfully retrieved`,
            data: rows,
        });
    } catch (error) {
        ServerError(res, error, 'error getting all trips');
    }
};

/** Filter options built from the active trips: unique, sorted values and the NGN price range */
export const GetAllPackagesDestinations = async (req, res) => {
    try {
        const isCached = getCache(cacheKeys.trip_filters)
        if (isCached) {
            return JsonResponse(res, 200, isCached)
        }
        const response = await db.Trips.findAll({
            where: { status: MainStatusOptions.true },
            attributes: ['destinations', 'prices', 'startDate', 'endDate', 'tripType']
        })

        const unique = (values) => [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
        const monthOrder = (month) => dayjs(`2000 ${month} 1`, 'YYYY MMMM D').month()
        const months = (values) => unique(values.filter((value) => value && dayjs(value).isValid()).map((value) => dayjs(value).format('MMMM')))
            .sort((a, b) => monthOrder(a) - monthOrder(b))
        const lowestPrices = response
            .map((trip) => Math.min(...(trip.prices ?? []).map((item) => Number(item.price)).filter((value) => Number.isFinite(value))))
            .filter((value) => Number.isFinite(value))

        const result = {
            countries: unique(response.flatMap((trip) => (trip.destinations ?? []).map((item) => item.country))).sort(),
            cities: unique(response.flatMap((trip) => (trip.destinations ?? []).map((item) => item.city))).sort(),
            // Lowest per-person price of each trip, in NGN (what the price filter compares)
            minPrice: lowestPrices.length ? Math.min(...lowestPrices) : 0,
            maxPrice: lowestPrices.length ? Math.max(...lowestPrices) : 0,
            startDates: months(response.map((trip) => trip.startDate)),
            endDates: months(response.map((trip) => trip.endDate)),
            tripTypes: unique(response.map((trip) => trip.tripType)),
        }
        setCache(cacheKeys.trip_filters, result)
        return JsonResponse(res, 200, result)
    } catch (error) {
        ServerError(res, error)
    }
}

export const DeleteTrip = async (req, res) => {
    try {
        const item = await db.Trips.findOne({ where: { id: req.params.id } });
        if (!item) return JsonResponse(res, 404, { message: 'Trip not found' });

        const images = item.images
        if (Number(images?.length) > 0) {
            await Promise.all(images.map(img => DeleteImage(img.file)));
        }

        // 4. Audit/Notification
        await db.Notifies.create({
            userId: req.user.id,
            title: 'Delete Package Trip',
            content: `A package trip with the title ${item.title} has been deleted`
        });

        await item.destroy();

        return JsonResponse(res, 200, { message: 'Trip successfully deleted' });

    } catch (error) {
        ServerError(res, error, 'error deleting trip');
    }
};

async function singleTripDetails(req) {
    try {

        const { id } = req.params
        let bankInfo = await db.Banks.findOne({
            where: { status: MainStatusOptions.true },
            attributes: ['accountName', 'accountNumber', 'bankName']
        })

        const [item, rate] = await Promise.all([
            db.Trips.findOne({
                where: { id: req.params.id },
            }),
            db.Rates.findOne({ where: { status: MainStatusOptions.true } })
        ])

        if (!item) throw new CustomError(404, 'Trip not found')


        const code = req.query.code ?? 'NGN'
        const isNg = IsNaira(req, rate, code)

        let prices;
        if (isNg.status) {
            prices = item.prices
        } else {
            prices = item.prices?.map(ele => {
                const sumed = ele.price / isNg.getRate.value
                return {
                    ...ele,
                    price: roundUpAmount(sumed),
                    basePrice: ele.price
                }
            })
        }
        const details = {
            currency: isNg.currency,
            symbol: isNg.symbol,
            ...item.toJSON(),
            prices: prices,
            earliestTravelDate: earliestTravelDate(item)?.format('YYYY-MM-DD') ?? null,
            ...bankInfo?.toJSON()
        }
        return { status: 200, message: details }
    } catch (error) {
        return { status: 500, message: error.message }
    }
}

export const GetSingleTrip = async (req, res) => {
    try {
        const details = await singleTripDetails(req)
        return JsonResponse(res, details.status, details.message)
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateTripStatus = async (req, res) => {
    try {
        const item = await db.Trips.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Trip not found' })


        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update Package Trip Status',
            content: `The status of a package trip with the title ${req.body.title} has been updated from ${item.status} to ${req.body.status}`
        })

        item.status = req.body.status
        await item.save()


        return JsonResponse(res, 200, { message: 'Trip status updated successfully' })

    } catch (error) {
        ServerError(res, error)
    }
}

/** Price breakdown for the checkout summary (same maths as the order) */
export const QuoteTrip = async (req, res) => {
    try {
        const trip = await db.Trips.findOne({ where: { id: req.body.tripId, status: MainStatusOptions.true } })
        if (!trip) throw new CustomError(404, 'Package not found')
        const quote = await quotePackage({ trip, travelers: req.body.travelers ?? [], currency: req.body.currency, voucherCode: req.body.voucher_code })
        return JsonResponse(res, 200, {
            travelers: quote.travelers.map(({ tag, priceType, baseAmount }) => ({ tag, priceType, baseAmount })),
            currency: quote.currency,
            // Whole units, like total: subtotal + fees = total
            subtotal: roundUpAmount(quote.currency === 'NGN' ? quote.subtotal : quote.subtotal / quote.rate),
            fees: quote.chargeAmount - roundUpAmount(quote.currency === 'NGN' ? quote.subtotal : quote.subtotal / quote.rate),
            total: quote.chargeAmount,
            discount: quote.discount,
            payable: quote.payable,
            voucher: quote.voucher ? { code: quote.voucher.code, discount_type: quote.voucher.discountType, discount_value: Number(quote.voucher.discountValue) } : null,
            earliest_travel_date: quote.earliestTravelDate,
        })
    } catch (error) {
        ServerError(res, error, 'Error pricing package')
    }
}

export const SaveTripEnquiries = async (req, res) => {
    try {
        const { message, travelers, currency, payment_method, voucher_code } = req.body

        const trip = await db.Trips.findOne({ where: { id: req.body.tripId, status: MainStatusOptions.true } })
        if (!trip) throw new CustomError(404, 'Package not found')

        // Group departures travel on the published start date
        const travelDate = trip.tripType === 'GROUP' ? dayjs(trip.startDate).format('YYYY-MM-DD') : req.body.travelDate
        assertVisaLeadTime(trip, travelDate)

        const quote = await quotePackage({ trip, travelers, currency, voucherCode: voucher_code })
        const isUnifiedPayment = payment_method === ServerTransactionPaymentType.unified_payment_transfer
        const firstTraveler = quote.travelers[0] || {}

        let transactionValue, payment
        const t = await db.sequelize.transaction()
        try {
            const enquiry = await db.TripEnquiries.create({
                message,
                travelers: quote.travelers,
                totalPrice: quote.total,
                travelDate,
                tripType: trip.tripType,
                status: 'UNFULFILLED',
                tripId: trip.id
            }, { transaction: t })

            transactionValue = await db.Transactions.create({
                tripId: enquiry.id,
                // NGN value of what is charged (reporting); `charge` holds the customer's currency
                amount: quote.currency === 'NGN' ? quote.payable : roundDecimal(quote.payable * quote.rate, 2),
                paymentType: isUnifiedPayment ? ServerTransactionPaymentType.unified_payment_transfer : ServerTransactionPaymentType.direct_bank_transfer,
                txType: TransactionTypes.trip,
                txid: generateReference(),
                discount: quote.discount,
                voucherCode: quote.voucher?.code ?? null,
                charge: {
                    currency: quote.currency,
                    rate: quote.rate,
                    amount: quote.payable,
                    markup_value: quote.markup.value,
                    vat: quote.markup.vat,
                }
            }, { transaction: t })

            if (quote.voucher) {
                const log = await reserveVoucher({ voucher: quote.voucher, email: firstTraveler.email, amount: quote.chargeAmount, discount: quote.discount, transactionId: transactionValue.id }, { transaction: t })
                await transactionValue.update({ isVoucher: log.id }, { transaction: t })
            }

            await db.Notifies.create({
                userId: req.admin.id,
                title: 'New Package Trip Enquiry',
                content: `A new package trip enquiry has been recieved from ${firstTraveler.firstName} ${firstTraveler.lastName}`
            }, { transaction: t });

            if (isUnifiedPayment) {
                payment = await createPayment({
                    amount: quote.payable,
                    currency: quote.currency,
                    transactionId: transactionValue.id,
                    description: `${trip.title?.trim()} (${trip.tripType} package)`,
                    returnRoute: `verify-payment/${transactionValue.id}/${transactionValue.txType}`,
                });
                if (payment.status !== 200) throw new CustomError(502, payment.message)
                await transactionValue.update({ orderId: payment.orderId, gatewayToken: payment.token }, { transaction: t });
            }

            await t.commit()
        } catch (error) {
            if (!t.finished) await t.rollback()
            throw error
        }

        await sendTransactionMail(transactionValue, MailKinds.received)
        return JsonResponse(res, 201, {
            message: 'Enquiry successfully received',
            attachment: `?transaction_type=${transactionValue.txType}&transaction_id=${transactionValue.id}`,
            url: isUnifiedPayment ? payment.url : null
        })
    } catch (error) {
        ServerError(res, error, 'Error processing trip')
    }
}

export const GetSingleTripForPayment = async (req, res) => {
    try {
        const [enquiry, transaction] = await Promise.all([
            db.TripEnquiries.findOne({
                where: {
                    id: req.params.id
                }
            }),
            db.Transactions.findOne({
                where: {
                    tripId: req.params.id,
                    paymentStatus: ServerTransactionStatusOptions.pending
                }
            })
        ])
        if (!enquiry) throw new CustomError(404, 'Enquiry not found')
        if (!transaction) throw new CustomError(404, 'Transaction not found')

        return JsonResponse(res, 200, {
            enquiry,
            transaction
        })
    } catch (error) {
        ServerError(res, error, 'unable to get single trip for payment')
    }
}

export const GetAllTripEnquiries = async (req, res) => {
    try {
        const { p, page_size, search } = req.query
        let where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            [Op.or]: [
                { firstname: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { travelDate: { [Op.like]: `%${search}%` } },
                { adults: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { paymentStatus: { [Op.like]: `%${search}%` } },
                { tripType: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.TripEnquiries.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
            include: [
                { model: db.Transactions, attributes: ["amount", "txid", "status", "paymentType", "paymentStatus"] },
                { model: db.Trips, attributes: ["title"] }
            ]
        })

        const details = []
        for (const ele of rows) {
            details.push({
                ...ele.toJSON(),
                Transactions: ele.Transactions?.[0]
            })
        }

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `Trip Enquiries successfully retrieved`, data: details })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateEnquiryStatus = async (req, res) => {
    try {
        const { status } = req.body
        const item = await db.TripEnquiries.findOne({ where: { id: req.body.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Enquiry not found' })

        // check if payment is already paid before fulfilling an enquiry
        if (status === 'FULFILLED') {
            const transact = await db.Transactions.findOne({ where: { tripId: item.id } })
            if (!transact) return JsonResponse(res, 404, { message: 'No transaction connected to this enquiry' })

            if (['PENDING', 'PART_PAID'].includes(transact.paymentStatus)) return JsonResponse(res, 400, { message: 'Only Paid Enuqiries can be updated to Fulfilled, kindly make sure the designated enquiry is fully paid' })
        }

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update Package Trip Enquiry',
            content: `The status of a package trip enquiry by ${item.fullname} has been updated from ${item.status} to ${status}`
        })
        await item.update({ status })

        return JsonResponse(res, 200, { message: `Enquiry Status Updated Successfully` })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateEnquiryTransaction = async (req, res) => {
    try {
        const { txid, id, status, paid, datePaid, reason } = req.body

        const [item, trans] = await Promise.all([
            db.TripEnquiries.findOne({ where: { id } }),
            db.Transactions.findOne({ where: { tripId: id, ...(txid ? { txid } : {}) } })
        ])

        if (!item) return JsonResponse(res, 404, { message: `No trip found!...` })
        if (!trans) return JsonResponse(res, 404, { message: `Transaction not found` })

        const previous = trans.paymentStatus
        await applyManualPaymentStatus(trans, { status, paid, datePaid, reason })
        await trans.reload()

        const lead = item.travelers?.[0] ?? {}
        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update Package Trip Payment Status',
            content: `The payment status of the package enquiry by ${lead.firstName ?? ''} ${lead.lastName ?? ''} changed from ${previous} to ${trans.paymentStatus}`
        })
        return JsonResponse(res, 200, { message: `Payment status updated to ${trans.paymentStatus}`, data: trans })
    } catch (error) {
        ServerError(res, error)
    }
}
