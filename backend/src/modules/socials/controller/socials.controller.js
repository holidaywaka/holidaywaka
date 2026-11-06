import { Op } from "sequelize"
import { JsonResponse, MainStatusOptions, PageOffset, ServerError, ServerPagination } from "../../../config/utilities.js"
import db from "../repository/socials.repository.js"
import { cacheKeys, deleteCache, getCache, setCache } from "../../../config/cacheConfig.js"



export const AddSocialLinks = async (req, res) => {
    try {
        const tag = req.body.tag
        const item = await db.Socials.findOne({ where: { tag } })
        if (item) return JsonResponse(res, 400, { message: `Social contact with the same Tag already exists` })
        await db.Socials.create({ ...req.body, status: req.body.status || MainStatusOptions.true })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'New Social Contact',
            content: `${tag} social contact link has been added`
        })

        deleteCache(cacheKeys.social)
        return JsonResponse(res, 201, { message: 'Social contact added successfully' })
    } catch (error) {
        ServerError(res, error, 'error adding social links')
    }
}

export const UpdateSocialLink = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.Socials.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 400, { message: `Social contact with the same Tag does not exists` })
        await item.update({
            link: req.body?.link || item.link,
            status: req.body?.status || item.status
        })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update on Social Contact',
            content: `${item.tag} social contact link has been updated`
        })

        deleteCache(cacheKeys.social)
        return JsonResponse(res, 200, { message: 'Social contact updated successfully' })
    } catch (error) {
        ServerError(res, error, 'error updating socials')
    }
}

export const DeleteSocialLink = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.Socials.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 400, { message: `Social contact with the same Tag does not exists` })

        await db.Socials.create({
            userId: req.admin.id,
            title: 'Delete on Social Contact',
            content: `${item.tag} social contact link has been deleted`
        })

        await item.destroy()
        deleteCache(cacheKeys.social)
        return JsonResponse(res, 200, { message: 'Social contact deleted successfully' })
    } catch (error) {
        ServerError(res, error, 'error deleting socials')
    }
}

export const SingleSocialLink = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.Socials.findOne({ where: { id } })
        if (!item) return JsonResponse(res, 400, { message: `Social contact with the same Tag does not exists` })
        return JsonResponse(res, 200, item)
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllSocialLinks = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const isCached = getCache(cacheKeys.social)
        if (isCached) {
            return JsonResponse(res, 200, isCached)
        }

        const where = {
            status: MainStatusOptions.true
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Socials.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })

        return JsonResponse(res, 200, { ...pagination, message: `Social contacts successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}


export const AdminGetAllSocialLinks = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { tag: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { link: { [Op.like]: `%${search}%` } },
            ]
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Socials.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        
        return JsonResponse(res, 200, { ...pagination, message: `Social contacts successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}
