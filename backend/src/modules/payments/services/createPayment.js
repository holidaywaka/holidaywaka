import currencyCode from "../../../config/currencyCode.js";
import { roundUpAmount } from "../../../config/utilities.js";
import { createUpOrder, getUpOrderStatus, upPaymentPageUrl } from "./upConfig.js";
import CustomError from "../../../middleware/custom-error.js";

const callback_url = process.env.UP_CALLBACK_URL
const return_url = process.env.UP_RETURN_URL

const clip = (value, max) => String(value ?? "").trim().slice(0, max)

/** What Unified Payment actually charges for an amount (prices are already whole units; this is the safety net) */
export const upChargeAmount = (amount) => roundUpAmount(amount)

/**
 * Starts a Unified Payment order and returns the customer's payment page.
 * Persist both `orderId` and `token` on the transaction: the token drives the payment page and status queries.
 * The amount must equal what the customer was shown.
 */
export async function createPayment({
    amount,
    currency,
    transactionId,
    description,
    returnRoute,
}) {
    try {
        if (!callback_url) throw new CustomError(404, `Host rejected`);
        if (!return_url) throw new CustomError(404, `Requesting Host not found`);
        if (!returnRoute) throw new CustomError(404, `Invalid client route provided`);

        const isCurrency = currencyCode.find(c => c.code === currency);
        if (!isCurrency) throw new CustomError(400, `Unsupported currency schema format: ${currency}`);

        // The gateway only charges whole units (it would record 1234.57 as 1235.00)
        const total = upChargeAmount(amount)
        if (!(total > 0)) throw new CustomError(400, "Payment amount must be greater than zero")

        const response = await createUpOrder({
            "description": clip(description, 150),
            "amount": total,
            "fee": 0,
            "currency": String(isCurrency.numeric).padStart(3, "0"),
            "returnUrl": `${return_url.replace(/\/$/, "")}/${returnRoute}`,
            "callbackUrl": callback_url,
            "count": 0,
            "orderType": "Purchase",
            // Our transaction id, so a gateway record can always be matched back
            "merchantRefData": clip(transactionId, 150),
            // GET redirect back to returnUrl: our frontend is static and cannot receive a POST
            "IsJson": true,
        });
        if (response.status !== 200) {
            throw new CustomError(502, response.message || "Payment Gateway Error");
        }

        return {
            status: 200,
            url: upPaymentPageUrl(response.data.token),
            orderId: response.data.orderId,
            token: response.data.token,
        }

    } catch (error) {
        return { status: 500, message: error.message?.toString() }
    }
}

/** Transaction status straight from the gateway, by order token */
export async function getUpTransaction({ token }) {
    try {
        if (!token) throw new CustomError(404, 'Payment token is required');
        const response = await getUpOrderStatus(token)
        if (response.status !== 200) {
            throw new CustomError(502, response?.message || "Payment Gateway Error");
        }
        return { status: 200, data: response.data }
    } catch (error) {
        return { status: 500, message: error.message?.toString() }
    }
}
