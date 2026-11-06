import { Op } from "sequelize"
import { JsonResponse, PageOffset, ServerError, ServerPagination } from "../../../config/utilities.js"
import db from "../repository/contacts.repository.js"



export const SubmitContactEnquiry = async (req, res) => {
    try {
        await db.Contacts.create(req.body)
        await db.Notifies.create({
            userId: req.admin.id,
            title: 'New Contact Enquiry',
            content: `A new contact enquiry from ${req.body.name} has just arrived`
        })
        return JsonResponse(res, 201, { message: `Your Enquiry has been successfuly received and is being attended to.` })
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllContactEnquiries = async (req, res) => {
    try {
        const { p, page_size, search } = req.query

        let where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { contact: { [Op.like]: `%${search}%` } },
                { message: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Contacts.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        return JsonResponse(res, 200, { ...pagination, message: `contact enquiries successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}