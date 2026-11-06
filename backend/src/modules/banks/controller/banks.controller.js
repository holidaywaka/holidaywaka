import { JsonResponse, MainStatusOptions, ServerError } from "../../../config/utilities.js"
import db from "../repository/banks.repository.js"

export const AddBank = async (req, res) => {
    try {
        await db.Banks.create({ ...req.body })
        await db.Notifies.create({
            userId: req.user.id,
            title: 'New Banking Information Added',
            content: `A new banking information has been added as the official account for recieving payments`
        })
        return JsonResponse(res, 201, { message: 'Bank Account added successfully' })
    } catch (error) {
        ServerError(res, error, 'error adding bank')
    }
}

export const UpdateBank = async (req, res) => {
    try {
        const item = await db.Banks.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: `Bank details does not exists` })
        await item.update({
            accountName: req.body?.accountName || item.accountName,
            accountNumber: req.body?.accountNumber || item.accountNumber,
            bankName: req.body?.bankName || item.bankName,
            status: req.body?.status || item.status
        })
        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update on Banking Information',
            content: `The account bank information has been updated`
        })
        return JsonResponse(res, 200, { message: 'Bank Account updated successfully' })
    } catch (error) {
        ServerError(res, error, 'error adding bank')
    }
}

export const FetchBankInformation = async (req, res) => {
    try {
        const item = await db.Banks.findOne({ where: { status: MainStatusOptions.true } })
        return JsonResponse(res, 200, item)
    } catch (error) {
        ServerError(res, error)
    }
}