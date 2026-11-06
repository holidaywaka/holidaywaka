import { Op } from "sequelize"
import { JsonResponse, MarkupOptions, PageOffset, ServerError, ServerPagination } from "../../../config/utilities.js"
import db from "../repository/markups.repository.js"



export const CreateMarkup = async (req, res) => {
    try {
        const item = await db.Markups.findOne({ where: { tag: req.body.tag } })
        if (item) return JsonResponse(res, 400, { message: 'Markup already exists' })
        await db.Markups.create({ ...req.body })

        return JsonResponse(res, 201, { message: 'Markup created successfully' })
    } catch (error) {
        ServerError(res, error, 'error creating markup')
    }
}

export const UpdateMarkup = async (req, res) => {
    try {
        const item = await db.Markups.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Markup not found' })

        // `??` so admins can set a value or VAT back to 0
        await item.update({
            status: req.body?.status ?? item.status,
            discountValue: req.body?.discountValue ?? item.discountValue,
            discountType: req.body?.discountType ?? item.discountType,
            vat: req.body?.vat ?? item.vat,
        })

        return JsonResponse(res, 200, { message: 'Markup updated successfully' })
    } catch (error) {
        ServerError(res, error, 'error updating markup')
    }
}

export const DeleteMarkup = async (req, res) => {
    try {
        const item = await db.Markups.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Markup not found' })
        await item.destroy()

        return JsonResponse(res, 200, { message: 'Markup deleted successfully' })
    } catch (error) {
        ServerError(res, error, 'error deleting markup')
    }
}

export const GetAllMarkups = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        let where = {}
        if (search !== undefined && search?.trim() !== '') {
            const isNumber = !isNaN(search)
            where = {
                ...where,
                [Op.or]: [
                    { tag: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                    { discountType: { [Op.like]: `%${search}%` } },
                    ...(isNumber ? [{ discountValue: Number(search) }] : []),
                    ...(isNumber ? [{ vat: Number(search) }] : []),
                ]
            }
        }


        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const { perPage, offset, page } = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Markups.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `markups successfully retrieved`, data: rows, services: Object.values(MarkupOptions) })
    } catch (error) {
        ServerError(res, error, 'error getting all markups')
    }
}

