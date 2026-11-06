import { Op } from "sequelize"
import { JsonResponse, MainStatusOptions, ServerError } from "../../../config/utilities.js"
import db from "../repository/rates.repository.js"

// Quotes are read everywhere as [{ quote: "USD", value: <NGN per 1 unit> }] with a numeric value
export const normalizeQuotes = (quotes) => quotes.map((item) => ({
    quote: String(item.quote).trim().toUpperCase(),
    value: Number(item.value),
}))

// Pricing reads "the" active rate, so only one may be active at a time
const deactivateOtherRates = (exceptId, transaction) => db.Rates.update(
    { status: MainStatusOptions.false },
    { where: { status: MainStatusOptions.true, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) }, transaction }
)

export const AddRate = async (req, res) => {
    try {
        const item = await db.sequelize.transaction(async (transaction) => {
            await deactivateOtherRates(null, transaction)
            return db.Rates.create({
                source: "NGN",
                status: MainStatusOptions.true,
                quotes: normalizeQuotes(req.body.quotes)
            }, { transaction })
        })

        return JsonResponse(res, 201, { message: `Rate added`, data: item })
    } catch (error) {
        ServerError(res, error, 'error adding rate')
    }
}

export const UpdateRate = async (req, res) => {
    try {
        const item = await db.Rates.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: `No Active Rate found` })

        await db.sequelize.transaction(async (transaction) => {
            if (req.body?.status === MainStatusOptions.true) await deactivateOtherRates(item.id, transaction)
            await item.update({
                status: req.body?.status ?? item.status,
                quotes: req.body?.quotes ? normalizeQuotes(req.body.quotes) : item.quotes
            }, { transaction })
        })

        return JsonResponse(res, 200, { message: `Rate Updated`, data: item })
    } catch (error) {
        ServerError(res, error, 'error updating rate')
    }
}

export const GetAllRates = async (req, res) => {
    try {
        const items = await db.Rates.findOne({ where: { status: MainStatusOptions.true }, order: [['updatedAt', 'DESC']] })
        const detail = !items ? {} : items;
        return JsonResponse(res, 200, detail)
    } catch (error) {
        ServerError(res, error, 'error getting all rates')
    }
}

export const DeleteRate = async (req, res) => {
    try {
        const item = await db.Rates.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: `No Active Rate found` })

        await item.destroy();
        return JsonResponse(res, 200, { message: `Rate removed` })
    } catch (error) {
        ServerError(res, error, 'error deleting rate')
    }
}
