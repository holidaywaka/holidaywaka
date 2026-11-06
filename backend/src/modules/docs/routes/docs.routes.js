
import express from "express"
import { AdminGetDocs, DeleteDocs, GetDocByTag, GetDocs, ManageDocs } from "../controller/docs.controller.js";
import { authenticate, authorized } from "../../../middleware/auth.js";
import { USER_TYPES } from "../../../config/utilities.js";
import { docsTagValidator, manageDocsValidator } from "../validator/docs.validator.js"

const route = express.Router();

route.get('', GetDocs)
route.get('/tag/:tag', docsTagValidator(), GetDocByTag)

route.use(authenticate)
route.use(authorized([USER_TYPES.admin]))

route.post('/manage', manageDocsValidator(), ManageDocs)
route.get('/all', AdminGetDocs)
route.delete('/tag/:tag', docsTagValidator(), DeleteDocs)

export default route