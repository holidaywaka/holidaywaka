import{ USER_TYPES } from "../../../config/utilities.js"
import{ CreateBlog, UpdateBlog, DeleteBlog, GetAllBlogs, FetchSingleBlog, AdminGetAllBlogs } from "../controller/blogs.controller.js"
import{ authenticate, authorized, sharedMiddleware, includeAdminMiddleware } from "../../../middleware/auth.js"
import{ createBlogValidator, blogIDValidator } from "../validator/blogs.validator.js"
import { IdParamsValidator } from "../../../validators/common.validator.js"

import express from "express"
const route = express.Router()

route.use(includeAdminMiddleware)

route.get("/", sharedMiddleware, GetAllBlogs)
route.get("/:id", IdParamsValidator(), FetchSingleBlog)

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

route.get("/admin/all", AdminGetAllBlogs)
route.post("/create", createBlogValidator(), CreateBlog)
route.put("/update", blogIDValidator(), UpdateBlog)
route.delete("/delete/:id", IdParamsValidator(), DeleteBlog)

export default route