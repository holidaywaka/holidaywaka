import cron from 'node-cron'
import axios from 'axios'
import db from '../repository/rates.repository.js';
import logger from '../../../middleware/logger.js';
import { MainStatusOptions, roundDecimal } from '../../../config/utilities.js';

const PROVIDER_URL = 'https://api.exchangerate.host/live'
const BASE_CURRENCY = 'USD'

/**
 * Fetches the live USD -> NGN rate and stores it on the active rate in the format the
 * app reads everywhere: quotes = [{ quote: "USD", value: <NGN per 1 USD> }].
 * Other quotes on the active rate (added by an admin) are kept.
 */
export async function syncExchangeRate() {
    const accessKey = process.env.EXCHANGE_RATE_API_KEY
    if (!accessKey) throw new Error('EXCHANGE_RATE_API_KEY is not configured')

    const { data } = await axios.get(PROVIDER_URL, {
        params: { access_key: accessKey, source: BASE_CURRENCY, currencies: 'NGN' },
        timeout: 15_000,
    })
    // Provider answers HTTP 200 with success: false on errors (bad key, quota...)
    const value = Number(data?.quotes?.[`${BASE_CURRENCY}NGN`])
    if (!data?.success || !(value > 0)) {
        throw new Error(`exchange rate provider error: ${JSON.stringify(data?.error ?? data)}`)
    }

    const usdQuote = { quote: BASE_CURRENCY, value: roundDecimal(value, 2) }
    const rate = await db.Rates.findOne({ where: { status: MainStatusOptions.true }, order: [['updatedAt', 'DESC']] })

    if (!rate) {
        await db.Rates.create({ source: 'NGN', quotes: [usdQuote], status: MainStatusOptions.true })
        logger.info(`[exchange-rate] created active rate USD->NGN ${usdQuote.value}`)
        return usdQuote
    }

    const quotes = Array.isArray(rate.quotes) ? rate.quotes : []
    const previous = quotes.find((item) => item.quote === BASE_CURRENCY)?.value
    await rate.update({ quotes: [...quotes.filter((item) => item.quote !== BASE_CURRENCY), usdQuote] })
    logger.info(`[exchange-rate] USD->NGN updated ${previous ?? 'none'} -> ${usdQuote.value}`)
    return usdQuote
}

function currencyRateScheduler() {
    if (process.env.EXCHANGE_RATE_SYNC_ENABLED === 'false') {
        logger.info('[exchange-rate] scheduler disabled (EXCHANGE_RATE_SYNC_ENABLED=false)')
        return
    }
    if (!process.env.EXCHANGE_RATE_API_KEY) {
        logger.warn('[exchange-rate] EXCHANGE_RATE_API_KEY missing; weekly rate update not scheduled')
        return
    }

    // Every Monday at 8 AM Lagos time
    cron.schedule('0 8 * * 1', async () => {
        try {
            await syncExchangeRate()
        } catch (error) {
            // Keep the current rate; prices continue with the last known value
            logger.error(`[exchange-rate] weekly update failed: ${error.message}`)
        }
    }, { timezone: 'Africa/Lagos' });
}

export default currencyRateScheduler
