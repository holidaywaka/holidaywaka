import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import { ServerError, JsonResponse, USER_TYPES } from "../config/utilities.js"
import db from "../database/index.js"
import { getCache, setCache } from "../config/cacheConfig.js"

dotenv.config();

export const cookieName = "access_token"

export const UrlMiddleware = (req, res, next) => {
    try {
        // const securedUrls = SecuredUrls[process.env.ENVIRONMENT];
        // const origin = req.headers.origin;

        // // Allow direct browser access (no origin) to public docs or GET requests
        // if ((!origin && req.method === 'GET')) {
        // // if ((!origin && req.method === 'GET') && (req.originalUrl.startsWith('/api/docs'))) {
        //   return next();
        // }

        // const hostname = origin?.split('://')[1];

        // if (!securedUrls.includes(hostname)) {
        //   return JsonResponse(res, 401, {
        //     message: 'UNAUTHORIZED ACCESS - CROSS ORIGIN RESOURCE SHARING (CORS) ERROR',
        //   });
        // }

        next();
    } catch (error) {
        ServerError(res, error)
    }
}

const cachekey = 'is-admin-account'

export const includeAdminMiddleware = async (req, res, next) => {
    try {
        const isCached = getCache(cachekey)
        if (isCached) {
            req.admin = isCached;
            next();
            return;
        }
        const user = await db.Users.findOne({ where: { role: USER_TYPES.admin } })
        if (!user) return JsonResponse(res, 404, { message: 'Unable to recieve requests at the moment' })
        req.admin = user.dataValues
        setCache(cachekey, user.dataValues);
        next()
    } catch (error) {
        ServerError(res, error)
    }
}

export const sharedMiddleware = (req, res, next) => {
    try {
        const tokenHeader = req.headers.cookie;
        if (tokenHeader) {
            req.role = USER_TYPES.admin
        } else {
            req.role = USER_TYPES.user
        }
        next()
    } catch (error) {
        ServerError(res, error)
    }
}

export const authenticate = async (req, res, next) => {
    try {
        const tokenHeader = req.headers.cookie;
        if(!tokenHeader) return JsonResponse(res, 403, {message: 'Access forbidden'});

        const token = tokenHeader.split(`${cookieName}=`)[1]
        if (token === "undefined") return JsonResponse(res, 404, { message: 'No active session found' })
        if (!token) return JsonResponse(res, 404, { message: 'Access Denied' })
        const verify = jwt.verify(token, process.env.JWT_SECRET)
        if (!verify) return JsonResponse(res, 404, { message: 'Unauthorized access' })
        const user = await db.Users.findOne({ where: { id: verify.id } })
        if (!user) return JsonResponse(res, 404, { message: `Unauthenticated Access` })
        req.user = user.dataValues
        next()
    } catch (error) {
        console.log(error, 'authenticate')
        ServerError(res, error)
    }
}

export const authorized = (roles) => (req, res, next) => {
    try {
        if (!roles.includes(req.user.role)) return JsonResponse(res, 403, { message: 'You do not have the permission to make this request' })
        next()
    } catch (error) {
        ServerError(res, error)
    }
}

export const AuthMiddleware = (req, res, next) => {
    try {
        const tokenHeader = req.headers.cookie;
        if(!tokenHeader) return JsonResponse(res, 403, {message: 'Access forbidden'});

        const token = tokenHeader.split(`${cookieName}=`)[1]
        if (token === "undefined") return res.status(404).json({ message: 'No active session found' })
        if (!token) return res.status(404).json({ message: 'Access Denied' })
        const verify = jwt.verify(token, process.env.JWT_SECRET)
        if (!verify) return console.log('Unauthorized access')
        req.user = verify.id
        next()
    } catch (error) {
        ServerError(res, error)
    }
}
