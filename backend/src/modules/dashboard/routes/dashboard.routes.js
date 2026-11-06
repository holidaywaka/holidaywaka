import express from "express"
import { query, validationResult } from "express-validator"
import { authenticate, authorized } from "../../../middleware/auth.js"
import { USER_TYPES, ValidatorError } from "../../../config/utilities.js"
import { DASHBOARD_RANGES, GetDashboard } from "../controller/dashboard.controller.js"
import { GetInsights } from "../controller/insights.controller.js"

const route = express.Router()

route.use(authenticate)
route.use(authorized(USER_TYPES.admin))

const rangeValidator = [
    query("range").optional().isIn(DASHBOARD_RANGES).withMessage(`range must be one of ${DASHBOARD_RANGES.join(", ")}`),
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) return ValidatorError(res, errors)
        next()
    },
]

route.get("", rangeValidator, GetDashboard)
route.get("/insights", rangeValidator, GetInsights)

export default route
