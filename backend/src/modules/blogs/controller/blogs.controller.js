import { cacheKeys, deleteCache, getCache, setCache } from "../../../config/cacheConfig.js"
import { UploadImage, DeleteImage } from "../../../config/cloudinaryConfig.js"
import { ServerError, JsonResponse, USER_TYPES, PageOffset, ServerPagination, MainStatusOptions, ServerSlugify } from "../../../config/utilities.js"
import db from "../repository/blogs.repository.js"



export const CreateBlog = async (req, res) => {
    try {
        const media = req.files?.media
        if (!media) return JsonResponse(res, 404, { message: `Media file is required` })

        const result = await UploadImage(media)
        if (result.status !== 200) return JsonResponse(res, result.status, { message: result.message })

        await db.Blogs.create({ ...req.body, media: result.media, status: MainStatusOptions.true, slug: ServerSlugify(req.body.title) })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'New Blog',
            content: `A new Blog with the title ${req.body.title} has been created`
        })
        deleteCache(cacheKeys.blogs)
        return JsonResponse(res, 201, { message: 'Blog added successfully' })
    } catch (error) {
        ServerError(res, error, 'error creating blog')
    }
}

export const UpdateBlog = async (req, res) => {
    try {
        const { id } = req.body
        const item = await db.Blogs.findOne({
            where: { id }
        })
        if (!item) return JsonResponse(res, 404, { message: 'Blog not found' })

        const media = req?.files?.media
        let file = item.media;
        if (media) {
            await DeleteImage(item.media)
            const result = await UploadImage(media)
            if (result.status !== 200) return JsonResponse(res, result.status, { message: result.message })
            file = result.media
        }

        await item.update({
            title: req.body?.title || item.title,
            read: req.body?.read || item.read,
            content: req.body?.content || item.content,
            url: req.body?.url || item.url,
            status: req.body?.status || item.status,
            media: file,
            slug: req.body?.title ? ServerSlugify(req.body.title) : item.slug
        })

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Update on Blog',
            content: `A Blog with the title ${item.title} has been updated`
        })
        deleteCache(cacheKeys.blogs)
        return JsonResponse(res, 200, { message: 'Blog updated successfully' })
    } catch (error) {
        ServerError(res, error, 'error updating blog')
    }
}

export const DeleteBlog = async (req, res) => {
    try {
        const { id } = req.params
        const item = await db.Blogs.findByPk(id)
        if (!item) return JsonResponse(res, 404, { message: 'Blog not found' })
        await DeleteImage(item.media)

        await db.Notifies.create({
            userId: req.user.id,
            title: 'Delete on Blog',
            content: `A Blog the title ${item.title} has been Deleted`
        })

        await item.destroy()
        deleteCache(cacheKeys.blogs)
        return JsonResponse(res, 200, { message: 'Blog deleted successfully' })
    } catch (error) {
        ServerError(res, error)
    }
}

export const FetchSingleBlog = async (req, res) => {
    try {
        const item = await db.Blogs.findOne({ where: { id: req.params.id } })
        if (!item) return JsonResponse(res, 404, { message: 'Blog not found' })
        return JsonResponse(res, 200, item)
    } catch (error) {
        ServerError(res, error)
    }
}

export const GetAllBlogs = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const isCached = getCache(cacheKeys.blogs)
        if (isCached) {
            return JsonResponse(res, 200, isCached)
        }

        const where = {
            status: MainStatusOptions.true
        }


        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Blogs.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        const sendResponse = { ...pagination, message: `Blogs successfully retrieved`, data: rows }
        setCache(cacheKeys.blogs, sendResponse)
        return JsonResponse(res, 200, sendResponse)
    } catch (error) {
        ServerError(res, error)
    }
}


export const AdminGetAllBlogs = async (req, res) => {
    try {
        const { p, page_size, search, status } = req.query

        const where = {}
        if (search !== undefined && search?.trim() !== '') where = {
            ...where,
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { status: { [Op.like]: `%${search}%` } },
                { read: { [Op.like]: `%${search}%` } },
            ]
        }


        const searchPage = search !== undefined && search?.trim() !== '' ? 1 : p
        const {perPage, offset, page} = PageOffset({ page_size, p: searchPage })
        const { rows, count } = await db.Blogs.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: perPage,
            offset,
        })

        const pagination = ServerPagination({ page, perPage, count })
        
        return JsonResponse(res, 200, { ...pagination, message: `Blogs successfully retrieved`, data: rows })
    } catch (error) {
        ServerError(res, error)
    }
}
