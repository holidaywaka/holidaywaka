


import { Op } from 'sequelize'
import { JsonResponse, ServerError, PageOffset, ServerPagination, CalculateVoucherDiscounts, ServerNaira, VoucherStatusOptions, MainStatusOptions } from '../../../config/utilities.js'
import dayjs from "dayjs"
import db from '../repository/vouchers.repository.js'
import { normalizeCode, previewVoucher } from '../services/voucher.service.js'
// ======================================  voucher management ==================================
export const CreateVoucher = async (req, res) => {
    try {
        const code = normalizeCode(req.body.code)
        const findVoucher = await db.Vouchers.findOne({ where: { code } })

        if (findVoucher) return JsonResponse(res, 409, { message: `Voucher with this code already exists` })

        // if account is connected 
        let user = null
        if (req.body.account) {
            user = await db.Users.findOne({ where: { email: req.body.account } })
            if (!user) return JsonResponse(res, 404, { message: `No Account associated with this email address` })
        }
        const newVoucher = await db.Vouchers.create({
            code,
            discountType: String(req.body.discountType).toUpperCase(),
            discountValue: Number(req.body.discountValue),
            expirationDate: req.body.expirationDate,
            maxUsageCount: Number(req.body.maxUsageCount) || 0,
            service: req.body.service,
            status: MainStatusOptions.true,
            accountId: user?.email ?? null,
        })


        return JsonResponse(res, 201, { message: `Voucher added successfully`, data: newVoucher })
    } catch (error) {
        ServerError(res, error, 'error creating voucher')
    }
}

export const UpdateVoucher = async (req, res) => {
    try {
        const { id } = req.params
        const findVoucher = await db.Vouchers.findOne({ where: { id } })
        if (!findVoucher) return JsonResponse(res, 404, { message: 'Voucher not found' })

        if (req.body.account) {
            const user = await db.Users.findOne({ where: { email: req.body.account } })
            if (!user) return JsonResponse(res, 404, { message: `No Account associated with this email address` })
        }

        await findVoucher.update({
            accountId: req.body?.account || findVoucher.accountId,
            discountType: req.body?.discountType ? String(req.body.discountType).toUpperCase() : findVoucher.discountType,
            discountValue: req.body?.discountValue ?? findVoucher.discountValue,
            expirationDate: req.body?.expirationDate || findVoucher.expirationDate,
            maxUsageCount: req.body?.maxUsageCount ?? findVoucher.maxUsageCount,
            service: req.body?.service || findVoucher.service,
            status: req.body?.status || findVoucher.status,
        })

        return JsonResponse(res, 200, { message: 'Voucher updated successfully', data: findVoucher })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllVouchers = async (req, res) => {
    try {
        const { p, page_size,
            discountType, discountValue, expirationDate, maxUsageCount, service, status, code
        } = req.query

        const where = {}
        if (discountType !== undefined) where.discountType = { [Op.like]: `%${discountType}` }
        if (discountValue !== undefined) where.discountValue = { [Op.like]: `%${discountValue}` }
        if (expirationDate !== undefined) where.expirationDate = { [Op.like]: `%${expirationDate}` }
        if (maxUsageCount !== undefined) where.maxUsageCount = { [Op.like]: `%${maxUsageCount}` }
        if (code !== undefined) where.code = { [Op.like]: `%${code}` }
        if (service !== undefined) where.service = { [Op.like]: `%${service}` }
        if (status !== undefined) where.status = status
        const { page, offset, perPage } = PageOffset({ p, page_size })

        const { rows, count } = await db.Vouchers.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            offset,
            limit: perPage,
        })
        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { message: `Vouchers fetched`, ...pagination, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetVoucherByCode = async (req, res) => {
    try {
        const code = req.params.id
        const item = await db.Vouchers.findOne({ where: { code: code?.toUpperCase() } })
        if (!item) return JsonResponse(res, 404, { message: `Voucher with ${code} not found` })
        return res.status(200).json(item)
    } catch (error) {
        ServerError(res, error)
    }
}

export const RemoveVoucherInfo = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.Vouchers.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 404, { message: `Voucher not found` })
        await item.destroy()

        return res.status(200).json({ message: 'Voucher Deleted' })
    } catch (error) {
        ServerError(res, error)
    }
}
export const ApplyVoucherCodeBeforePurchase = async (req, res) => {
    try {
        const { code, email, service, amount } = req.body;

        const item = await db.Vouchers.findOne({ where: { code } });
        if (!item) return JsonResponse(res, 404, { message: "Voucher with this code does not exist" });

        const [itemLog, itemLogs] = await Promise.all([
            db.VoucherLogs.findOne({
                where: { voucherID: item.id, email }
            }),
            db.VoucherLogs.findAll({
                where: { voucherID: item.id }
            })
        ]);

        // Voucher inactive?
        if (item.status !== MainStatusOptions.true)
            return JsonResponse(res, 400, { message: "Invalid voucher code" });

        // Voucher expired?
        if (new Date(item.expirationDate).getTime() < Date.now())
            return JsonResponse(res, 400, { message: "This voucher code has expired" });

        // Wrong service type?
        if (item.service !== service)
            return JsonResponse(res, 400, { message: "This code cannot be applied to this service" });

        // If user has an active pending log (not expired)
        if (itemLog && new Date(itemLog.expiry).getTime() > Date.now()) {
            item.currentUsageCount = itemLogs.length;
            await item.save();

            return JsonResponse(res, 200, {
                data: itemLog,
                voucher: item
            });
        }

        /** CLEAN EXPIRED PENDING LOGS FIRST */
        const expiredPending = itemLogs.filter(
            log => log.status === VoucherStatusOptions.pending && new Date(log.expiry).getTime() < Date.now()
        );

        if (expiredPending.length > 0) {
            for (const log of expiredPending) await log.destroy();

            const remaining = await db.VoucherLogs.count({ where: { voucherID: item.id } });

            await item.update({ currentUsageCount: remaining });
        }

        // Check max usage count after cleanup
        const freshCount = await db.VoucherLogs.count({ where: { voucherID: item.id } });
        if (freshCount >= item.maxUsageCount)
            return JsonResponse(res, 400, { message: "Voucher code no longer valid (usage limit reached)" });

        // Prepare markup
        const markup = {
            markup_type: item.discountType,
            value: item.discountValue
        };

        const discountedValue = CalculateVoucherDiscounts({ markup, amount });

        const newLogData = {
            email,
            memberId: item.accountId,
            voucherCode: item.code,
            status: VoucherStatusOptions.pending,
            date: dayjs().toDate(),
            expiry: dayjs().add(10, "minutes").toDate(),
            discountValueText: item.discountValue,
            discountTypeText: item.discountType,
            discountType:
                item.discountType?.toUpperCase() === "PERCENTAGE"
                    ? `${item.discountValue}%`
                    : `${ServerNaira}${item.discountValue?.toLocaleString()}`,
            discountedValue,
            priceCharge: amount
        };

        await db.VoucherLogs.create({
            ...newLogData,
            voucherID: item.id
        });

        const updatedCount = await db.VoucherLogs.count({ where: { voucherID: item.id } });

        await item.update({ currentUsageCount: updatedCount });

        return JsonResponse(res, 200, newLogData);

    } catch (error) {
        console.log(error);
        return ServerError(res, error);
    }
};
export const DisconnectVoucherCodeApplication = async (req, res) => {
    try {
        const { code, email } = req.body;

        const item = await db.Vouchers.findOne({ where: { code } });
        if (!item) return JsonResponse(res, 404, { message: "Voucher with this code does not exist" });

        const itemLog = await db.VoucherLogs.findOne({
            where: {
                voucherID: item.id,
                email,
                status: VoucherStatusOptions.pending
            }
        });

        if (!itemLog)
            return JsonResponse(res, 404, { message: "No active voucher usage found for this user" });

        // Voucher active?
        if (item.status !== MainStatusOptions.true)
            return JsonResponse(res, 400, { message: "Invalid voucher code" });

        // Voucher expired?
        if (new Date(item.expirationDate).getTime() < Date.now())
            return JsonResponse(res, 400, { message: "Voucher code has expired" });

        // Recover full price
        const discounted = itemLog.discountedValue;
        const originalPrice = Number(itemLog.priceCharge) + Number(discounted);

        await itemLog.destroy();

        return JsonResponse(res, 200, {
            message: "Voucher disconnected",
            data: { priceCharge: originalPrice }
        });

    } catch (error) {
        return ServerError(res, error, 'Error disconnecting voucher code');
    }
};


/** Checkout preview: validates a code and prices it without reserving a usage */
export const PreviewVoucher = async (req, res) => {
    try {
        const result = await previewVoucher({
            code: req.body.code,
            service: req.body.service,
            amount: Number(req.body.amount),
            currency: req.body.currency || 'NGN',
            ngnPerUsd: Number(req.body.rate) || 1,
        })
        return JsonResponse(res, 200, result)
    } catch (error) {
        ServerError(res, error, 'Error previewing voucher')
    }
}

/** Admin: usage history of one voucher */
export const GetVoucherLogs = async (req, res) => {
    try {
        const voucher = await db.Vouchers.findByPk(req.params.id)
        if (!voucher) return JsonResponse(res, 404, { message: 'Voucher not found' })
        const logs = await db.VoucherLogs.findAll({ where: { voucherID: voucher.id }, order: [['createdAt', 'DESC']] })
        const transactions = await db.Transactions.findAll({
            where: { id: logs.map((log) => log.transactionId).filter(Boolean) },
            attributes: ['id', 'txid', 'txType', 'paymentStatus', 'charge', 'createdAt'],
        })
        const byId = new Map(transactions.map((item) => [item.id, item]))
        return JsonResponse(res, 200, {
            voucher,
            data: logs.map((log) => ({ ...log.toJSON(), transaction: byId.get(log.transactionId) ?? null })),
        })
    } catch (error) {
        ServerError(res, error)
    }
}
