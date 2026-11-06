import { Op } from "sequelize"
import { JsonResponse, PageOffset, ServerError, ServerPagination } from "../../../config/utilities.js"
import db from "../repository/newsletters.repository.js"



export const SaveNewsLetters = async (req, res) => {
    try {
        const item = await db.NewsLetters.findOne({ where: { email: req.body.email } })
        if (item) return JsonResponse(res, 404, { message: 'Email already registered on our newsletters' })
        await db.NewsLetters.create(req.body)

        await db.Notifies.create({
            userId: req.admin.id,
            title: 'NewLetter Subscription',
            content: `A NewsLetter subscription has been recieved from ${req.body.email}`
        })

        return JsonResponse(res, 201, { message: `Your email has been recieved, thank you for subcribing to our newsletters` })
    } catch (error) {
        ServerError(res, error, 'error submitting newsletter')
    }
}

export const GetAllNewsLetters = async (req, res) => {
    try {
        const { p, page_size, search } = req.query

        const where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { email: { [Op.like]: `%${search}%` } }
            ]
        }


        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.NewsLetters.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `newsletters successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error, 'error getting all newsletters')
    }
}
