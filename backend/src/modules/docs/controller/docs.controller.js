import { Op } from "sequelize"
import { cacheKeys, deleteCache, getCache } from "../../../config/cacheConfig.js"
import { JsonResponse, MainStatusOptions, PageOffset, ServerError, ServerPagination } from "../../../config/utilities.js"
import db from "../repository/docs.repository.js"


export const ManageDocs = async (req, res) => {
    try {
        const exists = await db.Docs.findOne({ where: { tag: req.body.tag } })
        if (!exists) {
            await db.Docs.create(req.body)
            deleteCache(cacheKeys.docs)
            return JsonResponse(res, 201, { message: `${req.body.tag} document created successfully` })
        } else {
            await db.Docs.update(req.body, { where: { tag: req.body.tag } })
            deleteCache(cacheKeys.docs)
            return JsonResponse(res, 200, { message: `${req.body.tag} document updated successfully` })
        }
    } catch (error) {
        ServerError(res, error, "Error creating document")
    }
}

export const GetDocs = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const isCached = getCache(cacheKeys.docs)
        if (isCached) {
            return JsonResponse(res, 200, isCached)
        }

        const where = {
            status: MainStatusOptions.true
        }

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Docs.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })

        return JsonResponse(res, 200, { ...pagination, message: `Documents successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error, "Error fetching documents")
    }
}

export const AdminGetDocs = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const where = {}

        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Docs.findAndCountAll({
            distinct: true,
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })

        return JsonResponse(res, 200, { ...pagination, message: `Documents successfully retrieved by admin`, data: rows })
    } catch (error) {
        ServerError(res, error, "Error fetching documents")
    }
}

export const GetDocByTag = async (req, res) => {
    try {
        const docs = await db.Docs.findOne({ where: { 
            [Op.or]: {
                tag: req.params.tag,
                id: req.params.tag
            }, 
            status: MainStatusOptions.true } })
        if (!docs) {
            return JsonResponse(res, 404, { message: `Document with tag ${req.params.tag} not found` })
        }
        return JsonResponse(res, 200, docs)
    } catch (error) {
        ServerError(res, error, "Error fetching document")
    }
}

export const DeleteDocs = async (req, res) => {
    try {
        const docs = await db.Docs.findOne({ where: { tag: req.params.tag } })
        if (!docs) {
            return JsonResponse(res, 404, { message: `Document with tag ${req.params.tag} not found` })
        }
        await docs.destroy()

        return JsonResponse(res, 200, { message: `Document with tag ${req.params.tag} deleted successfully` })
    } catch (error) {
        ServerError(res, error, "Error fetching document")
    }
}