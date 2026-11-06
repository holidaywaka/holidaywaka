import { ServerError, JsonResponse } from "../../../config/utilities.js"
import { createPayment, getUpTransaction } from "../services/createPayment.js"

/** Admin: create a small gateway order to check the Unified Payment credentials and URLs */
export const TestPayment = async (req, res) => {
    try {
        const reference = `test_${Date.now()}`
        const payment = await createPayment({
            amount: Number(req.body.amount || 100),
            currency: req.body.currency || "NGN",
            transactionId: reference,
            description: "Holidaywaka gateway test",
            returnRoute: `verify-payment/${reference}/TEST`,
        })
        if (payment.status !== 200) return JsonResponse(res, 502, { message: payment.message })
        return JsonResponse(res, 200, { data: payment })
    } catch (error) {
        ServerError(res, error)
    }
}

/** Admin: raw gateway status for an order token */
export const TestPaymentStatus = async (req, res) => {
    try {
        const status = await getUpTransaction({ token: req.params.token })
        if (status.status !== 200) return JsonResponse(res, 502, { message: status.message })
        return JsonResponse(res, 200, { data: status.data })
    } catch (error) {
        ServerError(res, error)
    }
}
