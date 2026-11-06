import { col, fn, Op, where as seqWhere } from "sequelize";
import { cacheKeys, deleteCache, getCache, setCache } from "../../../config/cacheConfig.js";
import { ServerError, JsonResponse, PageOffset, ServerPagination, USER_TYPES, TransactionTypes, generateReference, IsNaira, MainStatusOptions, ServerTransactionPaymentType, ServerTransactionStatusOptions, MarkupOptions, displayMarkupPercent, roundUpAmount } from "../../../config/utilities.js"
import { createPayment } from "../../payments/services/createPayment.js";
import CustomError from "../../../middleware/custom-error.js";
import logger from "../../../middleware/logger.js";
import db from "../repository/visas.repository.js";
import { applyManualPaymentStatus } from "../../payments/services/payment-events.js";
import { MailKinds, sendTransactionMail } from "../../notifications/services/transaction-mail.js";
import { findUsableVoucher, reserveVoucher, voucherDiscount } from "../../vouchers/services/voucher.service.js";


/** Server-side price for the chosen visa: the appointment fee, or the visa type's full price */
async function priceVisa(visaPayload) {
    const country = await db.VisaCountries.findOne({ where: { country: visaPayload.country, status: MainStatusOptions.true } })
    if (!country) throw new CustomError(404, `Visa applications for ${visaPayload.country} are not available`)
    const destination = (country.destinations ?? []).find((item) => item.visaType === visaPayload.visaType)
    if (!destination) throw new CustomError(404, `${visaPayload.visaType} is not offered for ${country.country}`)
    const amount = visaPayload.paymentType === 'appointment' ? Number(country.fee) : Number(destination.price)
    if (!(amount > 0)) throw new CustomError(400, 'This visa has no price set yet. Please send an enquiry instead.')
    return { amount, country, destination }
}

export const createVisaEnquiry = async (req, res) => {
    try {
        const paymentTypesListings = [
            { label: 'appointment', value: "Appointment" },
            { label: 'fullPayment', value: "Full Payment" },
            { label: 'enquiry', value: "Enquiry" },
        ];

        // Safe fallback matching
        const visaPayload = req.body?.visa || {};
        const paymentType = paymentTypesListings.find(ele => ele.label === visaPayload.paymentType)?.value || paymentTypesListings[0].value;
        const isEnquiry = paymentType === paymentTypesListings[2].value;
        const isUnifiedPayment = !isEnquiry && visaPayload.payment_method === ServerTransactionPaymentType.unified_payment_transfer;

        const [rateResponse, markup, priced] = await Promise.all([
            db.Rates.findOne({ where: { status: MainStatusOptions.true } }),
            db.Markups.findOne({ where: { tag: MarkupOptions.visa, status: MainStatusOptions.true } }),
            isEnquiry ? null : priceVisa(visaPayload),
        ]);
        const isNg = IsNaira(res, rateResponse, req.body.currency);
        const conversionRate = Number(isNg.getRate?.value || 1);

        // Prices are stored in NGN; non-Nigerian visitors pay the USD equivalent
        const totalNaira = priced ? (markup?.id ? displayMarkupPercent(priced.amount, markup.discountValue, markup.vat) : priced.amount) : 0
        const chargeCurrency = isNg.status ? 'NGN' : isNg.currency
        const chargeAmount = roundUpAmount(chargeCurrency === 'NGN' ? totalNaira : totalNaira / conversionRate)

        const voucher = !isEnquiry && req.body.voucher_code ? await findUsableVoucher(req.body.voucher_code, TransactionTypes.visa) : null
        const discount = voucher ? voucherDiscount(voucher, chargeAmount, chargeCurrency, conversionRate) : 0
        const payable = Math.max(0, chargeAmount - discount)

        let values, payment;
        const t = await db.sequelize.transaction();
        try {
            const newEnquiry = await db.VisaEnquiries.create({
                ...req.body,
                // The stored visa summary reflects the server price, never the client's
                visa: { ...visaPayload, ...(priced ? { price: Number(priced.destination.price), fee: Number(priced.country.fee), amount: priced.amount } : {}) },
            }, { transaction: t });

            if (!isEnquiry) {
                values = await db.Transactions.create({
                    visaId: newEnquiry.id,
                    amount: chargeCurrency === 'NGN' ? payable : payable * conversionRate,
                    txType: TransactionTypes.visa,
                    paymentType: isUnifiedPayment ? ServerTransactionPaymentType.unified_payment_transfer : ServerTransactionPaymentType.direct_bank_transfer,
                    txid: generateReference(),
                    discount,
                    voucherCode: voucher?.code ?? null,
                    charge: {
                        currency: chargeCurrency,
                        rate: conversionRate,
                        amount: payable,
                        markup_value: markup?.id ? markup.discountValue : 0,
                        vat: markup?.id ? markup.vat : 0,
                    }
                }, { transaction: t });

                if (voucher) {
                    const log = await reserveVoucher({ voucher, email: newEnquiry.email, amount: chargeAmount, discount, transactionId: values.id }, { transaction: t })
                    await values.update({ isVoucher: log.id }, { transaction: t })
                }

                if (isUnifiedPayment) {
                    payment = await createPayment({
                        amount: payable,
                        description: `${visaPayload.country || 'Visa'} - ${visaPayload.visaType || 'Application'} (${paymentType})`,
                        transactionId: values.id,
                        currency: chargeCurrency,
                        returnRoute: `verify-payment/${values.id}/${values.txType}`,
                    });
                    if (payment.status !== 200) throw new CustomError(502, payment.message);
                    await values.update({ orderId: payment.orderId, gatewayToken: payment.token }, { transaction: t })
                }
            }

            await db.Notifies.create({
                userId: req.admin.id,
                title: isEnquiry ? 'New visa enquiry' : 'New visa application',
                content: `${newEnquiry.firstName} ${newEnquiry.lastName} ${isEnquiry ? 'sent an enquiry' : 'started an application'} for ${visaPayload.country} ${visaPayload.visaType ?? ''}`.trim(),
            }, { transaction: t })

            await t.commit();
        } catch (error) {
            if (!t.finished) await t.rollback();
            logger.error(`Transaction aborted: ${error.message}`);
            throw error;
        }

        if (values) await sendTransactionMail(values, MailKinds.received)

        return JsonResponse(res, 201, {
            message: "Thank you for submitting your visa enquiry. We will get back to you shortly.",
            isEnquiry,
            attachment: isEnquiry ? null : `?transaction_type=${values.txType}&transaction_id=${values.id}`,
            url: isUnifiedPayment ? payment.url : null
        });
    } catch (error) {
        return ServerError(res, error, 'error creating visa enquiries');
    }
};

export const GetAllVisaEnquiries = async (req, res) => {
    try {
        const { p, page_size, search } = req.query
        let where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            [Op.or]: [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { travelDate: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { nationality: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.VisaEnquiries.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.Transactions, attributes: ["amount", "txid", "status", "paymentType", "paymentStatus"] },
            ],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `Visa Enquiries successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateVisaEnquiryStatus = async (req, res) => {
    try {
        const { status } = req.body
        const item = await db.VisaEnquiries.findOne({ where: { id: req.body.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Visa Enquiry not found' })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update Visa Enquiry',
            content: `The status of a Visa enquiry by ${item.firstName} has been updated from ${item.status} to ${status}`
        })
        await item.update({ status })

        return JsonResponse(res, 200, { message: `Visa Enquiry Status Updated Successfully`, data: item })
    } catch (error) {
        ServerError(res, error)
    }
}

/**
 * Admin: record the payment status of a visa application.
 * Enquiry-only applications have no transaction until a price is agreed, so the first update creates it
 * from the amount the admin enters (in NGN).
 */
export const UpdateVisaEnquiryTransaction = async (req, res) => {
    try {
        const { id, status, paid, datePaid, reason, amount } = req.body

        const item = await db.VisaEnquiries.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 404, { message: `No visa enquiry found` })

        let trans = await db.Transactions.findOne({ where: { visaId: id } })
        if (!trans) {
            const total = roundUpAmount(amount)
            if (!(total > 0)) return JsonResponse(res, 400, { message: 'Enter the amount agreed with the applicant (NGN) to record a payment for this enquiry' })
            trans = await db.Transactions.create({
                visaId: id,
                txType: TransactionTypes.visa,
                txid: generateReference(),
                amount: total,
                paymentType: ServerTransactionPaymentType.direct_bank_transfer,
                charge: { currency: 'NGN', amount: total, rate: 1, markup_value: 0, vat: 0 },
            })
        }

        const previous = trans.paymentStatus
        await applyManualPaymentStatus(trans, { status, paid, datePaid, reason })
        await trans.reload()

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update Visa Enquiry Payment Status',
            content: `The payment status of the visa application by ${item.firstName} ${item.lastName} changed from ${previous} to ${trans.paymentStatus}`
        })
        return JsonResponse(res, 200, { message: `Payment status updated to ${trans.paymentStatus}`, data: trans })
    } catch (error) {
        ServerError(res, error)
    }
}


export const AddVisaCountry = async (req, res) => {
    try {
        const item = await db.VisaCountries.findOne({ where: { country: req.body.country } })
        if (item) return JsonResponse(res, 400, { message: `Visa country already exists` })

        await db.VisaCountries.create({ ...req.body, status: MainStatusOptions.true })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'New Visa country added',
            content: `${req.body.country} country for accepting visa has been created`
        })

        deleteCache(cacheKeys.visa)
        return JsonResponse(res, 201, { message: 'Visa country added successfully' })
    } catch (error) {
        ServerError(res, error)
    }
}

export const UpdateVisaCountry = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.VisaCountries.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 404, { message: `Visa country not found` })

        await item.update({ ...req.body })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update on visa country',
            content: `${item.country} visa info has been updated`
        })


        deleteCache(cacheKeys.visa)
        return JsonResponse(res, 200, { message: 'country updated successfully' })
    } catch (error) {
        ServerError(res, error)
    }
}

export const DeleteVisaCountry = async (req, res) => {
    try {
        const item = await db.VisaCountries.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Visa country not found' })
        await item.destroy()
        deleteCache(cacheKeys.visa)
        return JsonResponse(res, 201, { message: 'Visa country successfully removed' })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllVisaCountries = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query;

        const isSearch = search !== undefined && search?.trim() !== ""

        if (search === undefined && search?.trim() === "") {
            const isCached = getCache(cacheKeys.visa)
            if (isCached) {
                return JsonResponse(res, 200, isCached)
            }
        }

        const where = {
            status: MainStatusOptions.true,
            ...(isSearch ? {
                [Op.or]: [
                    { country: { [Op.like]: `%${search}%` } },
                    db.sequelize.literal(
                        `JSON_SEARCH(destinations, 'one', '%${search}%', NULL, '$[*].visaType') IS NOT NULL`
                    ),
                    db.sequelize.literal(
                        `JSON_SEARCH(destinations, 'one', '%${search}%', NULL, '$[*].requirement') IS NOT NULL`
                    ),
                    // db.Sequelize.literal(
                    //     `JSON_EXTRACT(destinations, '$[*].visaType') LIKE '%${search}%'`
                    // )
                ]
            } : {})
        }


        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.VisaCountries.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        const sendResponse = { ...pagination, message: `Visa Countries successfully retrieved`, data: rows }
        setCache(cacheKeys.visa, sendResponse)
        return JsonResponse(res, 200, sendResponse)
    } catch (error) {
        ServerError(res, error)
    }
}

export const AdminGetAllVisaCountries = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { status: { [Op.like]: `%${search}%` } },
                { country: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.VisaCountries.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })

        return JsonResponse(res, 200, { ...pagination, message: `Visa Countries successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}
