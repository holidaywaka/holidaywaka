/**
 * ETG / RateHawk certification test cases (sandbox).
 * https://docs.emergingtravel.com/docs/certification/  ·  https://docs.emergingtravel.com/docs/fundamentals/sandbox/
 *
 * Every scenario goes through the same code as a customer: hotelpage -> prebook -> checkout -> payment ->
 * booking form -> booking finish -> booking status (-> cancel). Each ETG request/response pair is captured.
 *
 * Usage (from backend/):  node src/scripts/ratehawk-certification.js [scenario-id ...]
 * Output: docs/ratehawk-certification/README.md (summary for submission) and runs/<timestamp>/*.json (full logs).
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import crypto from "crypto"
import dayjs from "dayjs"

process.env.DISABLE_TRANSACTION_MAIL = "true"
process.env.RATEHAWK_STATUS_POLL_MS ??= "2000"

const { default: db } = await import("../database/index.js")
const { onRatehawkExchange, rtConfigs, default: ratehawkConfig } = await import("../modules/hotels/services/ratwhawk.config.js")
const { getHotelRates, prebookRate } = await import("../modules/hotels/services/hotel-search.service.js")
const { createHotelCheckout, startHotelBooking, cancelHotelBooking, refreshOrderInfo } = await import("../modules/hotels/services/hotel-booking.service.js")
const { ServerTransactionMainStatus, ServerTransactionPaymentType, ServerTransactionStatusOptions } = await import("../config/utilities.js")

await db.ready

if (!String(rtConfigs.apiUrl).includes("sandbox")) {
    console.error("Refusing to run: RATEHAWK_API_URL is not the sandbox. These cases create real bookings otherwise.")
    process.exit(1)
}

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../docs/ratehawk-certification")
const RUN_ID = dayjs().format("YYYY-MM-DD_HH-mm-ss")
const RUN_DIR = path.join(OUT_DIR, "runs", RUN_ID)
fs.mkdirSync(RUN_DIR, { recursive: true })

// A stay ~5 weeks out, 2 nights, so refundable rates are available
const CHECKIN = dayjs().add(35, "day").format("YYYY-MM-DD")
const CHECKOUT = dayjs().add(37, "day").format("YYYY-MM-DD")
const CONTACT = { first_name: "John", last_name: "Smith", email: process.env.RATEHAWK_BOOKING_EMAIL || process.env.MAIL_USER, phone: "+2348050743775" }
const ADULT_NAMES = [["John", "Smith"], ["Mary", "Smith"], ["Peter", "Brown"], ["Grace", "Brown"]]
const CHILD_NAMES = [["Tom", "Smith"], ["Anna", "Smith"], ["Leo", "Brown"], ["Mia", "Brown"]]

const SCENARIOS = [
    {
        id: "children",
        title: "Booking with children",
        requirement: "All partners: child age logic (HID 10004834, 1 room, 2 adults + children aged 0 and 17).",
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [0, 17] }],
        expect: { status: "confirmed" },
        cancelAfter: true,
    },
    {
        id: "multiroom",
        title: "Multiroom with mixed adults and children",
        requirement: "Multiroom partners: room 1 = 2 adults + child 3; room 2 = 2 adults + children 1, 5, 17 (HID 10004834).",
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [3] }, { adults: 2, children: [1, 5, 17] }],
        expect: { status: "confirmed" },
        cancelAfter: true,
    },
    {
        id: "uzbekistan",
        title: "Booking with Uzbekistan guest citizenship",
        requirement: "All partners: residency sent correctly in search (HID 10004834, residency uz, 1 room, 2 adults).",
        hid: 10004834, residency: "uz",
        guests: [{ adults: 2, children: [] }],
        expect: { status: "confirmed" },
        cancelAfter: true,
    },
    {
        id: "price-increase",
        title: "Rate price increase at prebook",
        requirement: "Partners allowing price changes: price_increase_percent and book_hash logic (HID 8819557, 10% increase). The guest is shown the new price before booking.",
        hid: 8819557, residency: "ng",
        guests: [{ adults: 2, children: [] }],
        expect: { status: "confirmed", priceChanged: true },
        cancelAfter: true,
    },
    {
        id: "unknown-success",
        title: "Success after unknown error",
        requirement: "All partners: keep polling /booking/finish/status/ after `unknown` until `ok` (partner_order_id suffix unknown_success).",
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [] }],
        suffix: "unknown_success",
        expect: { status: "confirmed" },
        cancelAfter: true,
    },
    {
        id: "unknown-soldout",
        title: "Failed with soldout after unknown error",
        requirement: "All partners: keep polling until `soldout`, then mark the booking failed (suffix unknown_soldout).",
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [] }],
        suffix: "unknown_soldout",
        expect: { status: "failed", etgStatus: "soldout" },
    },
    {
        id: "unknown-book-limit",
        title: "Failed with book_limit after unknown error",
        requirement: "All partners: identify `book_limit` and fail the booking (suffix unknown_book_limit).",
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [] }],
        suffix: "unknown_book_limit",
        expect: { status: "failed", etgStatus: "book_limit" },
    },
    {
        id: "cancel-not-cancellable",
        title: "Cancellation: order_not_cancellable",
        requirement: "Sandbox error reproduction (optional, not a certification case): booking created with suffix order_not_cancellable; cancellation should surface order_not_cancellable.",
        informational: true,
        hid: 10004834, residency: "ng",
        guests: [{ adults: 2, children: [] }],
        suffix: "order_not_cancellable",
        expect: { status: "confirmed", cancelError: "order_not_cancellable" },
        cancelAfter: true,
    },
    {
        id: "cancel-not-found",
        title: "Cancellation: order_not_found",
        requirement: "Sandbox error reproduction: cancelling a nonexistent partner_order_id returns order_not_found.",
        standalone: true,
        expect: { cancelError: "order_not_found" },
    },
]

const roomsFor = (guests) => {
    let adultIndex = 0
    let childIndex = 0
    return guests.map((room) => ({
        adults: Array.from({ length: room.adults }, () => {
            const [first, last] = ADULT_NAMES[adultIndex++ % ADULT_NAMES.length]
            return { first_name: first, last_name: last }
        }),
        children: room.children.map(() => {
            const [first, last] = CHILD_NAMES[childIndex++ % CHILD_NAMES.length]
            return { first_name: first, last_name: last }
        }),
    }))
}

/** Refundable "deposit" rates first (ETG asks to test with refundable rates), then cheapest */
function pickRate(rates) {
    const bookable = rates.filter((rate) => rate.book_hash && rate.payment?.type === "deposit")
    const refundable = bookable.filter((rate) => rate.payment.free_cancellation_before && dayjs(rate.payment.free_cancellation_before).isAfter(dayjs()))
    return (refundable.length ? refundable : bookable)[0] ?? null
}

async function runScenario(scenario) {
    const exchanges = []
    const unsubscribe = onRatehawkExchange((exchange) => exchanges.push(exchange))
    const steps = []
    const step = (name, detail) => { steps.push({ at: new Date().toISOString(), step: name, ...detail }); console.log(`   · ${name}`, detail?.summary ?? "") }
    const result = { id: scenario.id, title: scenario.title, requirement: scenario.requirement, started_at: new Date().toISOString(), steps, exchanges }

    try {
        if (scenario.standalone) {
            const partnerOrderId = crypto.randomUUID()
            try {
                await ratehawkConfig.post({ endpoint: ratehawkConfig.apis.b2b_order_cancel, data: { partner_order_id: partnerOrderId } })
                result.outcome = { cancel_error: null }
            } catch (error) {
                result.outcome = { cancel_error: error.code }
            }
            step("cancel nonexistent order", { summary: result.outcome.cancel_error, partner_order_id: partnerOrderId })
        } else {
            const params = { checkin: CHECKIN, checkout: CHECKOUT, residency: scenario.residency, currency: "USD", guests: scenario.guests }
            const hotelPage = await getHotelRates(scenario.hid, params, null)
            const rate = pickRate(hotelPage.rates)
            step("hotelpage", { summary: `${hotelPage.rates.length} rates`, hid: scenario.hid, residency: scenario.residency, guests: scenario.guests })
            if (!rate) throw new Error("No bookable deposit rate returned by hotelpage")

            const prebook = await prebookRate(scenario.hid, params, rate.book_hash, null)
            step("prebook", {
                summary: `${prebook.price_changed ? "price changed" : "price unchanged"} (${prebook.original_amount} -> ${prebook.amount} ${prebook.currency})`,
                book_hash: prebook.book_hash, price_changed: prebook.price_changed, original_amount: prebook.original_amount, amount: prebook.amount,
            })

            const checkout = await createHotelCheckout({
                prebookId: prebook.id,
                contact: CONTACT,
                rooms: roomsFor(scenario.guests),
                comment: `ETG certification: ${scenario.title}`,
                paymentMethod: ServerTransactionPaymentType.direct_bank_transfer,
                userIp: "127.0.0.1",
            })
            step("checkout", { summary: checkout.booking.reference, booking_id: checkout.booking.id })

            // Simulates the guest's payment being confirmed (production: webhook / admin), without the background trigger
            await db.Transactions.update(
                { paymentStatus: ServerTransactionStatusOptions.paid, status: ServerTransactionMainStatus.close, notifiedStatus: ServerTransactionStatusOptions.paid },
                { where: { id: checkout.transaction.id } }
            )
            step("payment confirmed", { summary: "transaction marked PAID" })

            const booking = await startHotelBooking(checkout.booking.id, { partnerOrderSuffix: scenario.suffix ?? "", wait: true })
            step("booking finished", { summary: `${booking.status} (${booking.etgStatus})`, status: booking.status, etg_status: booking.etgStatus, partner_order_id: booking.partnerOrderId, etg_order_id: booking.etgOrderId, failure_reason: booking.failureReason })

            result.outcome = {
                status: booking.status,
                etg_status: booking.etgStatus,
                partner_order_id: booking.partnerOrderId,
                partner_order_ids: booking.partnerOrderIds,
                etg_order_id: booking.etgOrderId ? Number(booking.etgOrderId) : null,
                price_changed: prebook.price_changed,
                booking_reference: booking.reference,
                guests_sent: booking.rooms,
            }

            // ETG syncs new orders asynchronously: order info / cancel can answer order_not_found for a minute or two
            const SYNC_RETRIES = 8
            const SYNC_WAIT_MS = 15_000
            if (booking.status === "confirmed") {
                for (let attempt = 1; attempt <= SYNC_RETRIES; attempt++) {
                    try {
                        const info = await refreshOrderInfo(booking.id)
                        step("order info", { summary: `retrieved (ETG status ${info.order_info?.status}, HCN ${info.hotel_confirmation_number ?? "pending"})` })
                        break
                    } catch (error) {
                        step("order info", { summary: `attempt ${attempt}: ${error.code ?? error.message}` })
                        if (attempt < SYNC_RETRIES) await new Promise((resolve) => setTimeout(resolve, SYNC_WAIT_MS))
                    }
                }
            }

            if (scenario.cancelAfter && booking.status === "confirmed") {
                for (let attempt = 1; attempt <= SYNC_RETRIES; attempt++) {
                    try {
                        const cancelled = await cancelHotelBooking(booking.id, { reason: "Certification test clean-up" })
                        result.outcome.cancel_error = null
                        result.outcome.cancellation = cancelled.cancellation
                        step("cancel", { summary: "cancelled", cancellation: cancelled.cancellation })
                        break
                    } catch (error) {
                        result.outcome.cancel_error = error.code ?? error.message
                        step("cancel", { summary: `attempt ${attempt}: ${result.outcome.cancel_error}` })
                        if (result.outcome.cancel_error !== "order_not_found" || attempt === SYNC_RETRIES) break
                        await new Promise((resolve) => setTimeout(resolve, SYNC_WAIT_MS))
                    }
                }
            }
        }
    } catch (error) {
        result.error = `${error.code ? `${error.code}: ` : ""}${error.message}`
        step("error", { summary: result.error })
    } finally {
        unsubscribe()
    }

    const expect = scenario.expect ?? {}
    const outcome = result.outcome ?? {}
    const checks = [
        expect.status ? outcome.status === expect.status : true,
        expect.etgStatus ? outcome.etg_status === expect.etgStatus : true,
        expect.priceChanged !== undefined ? outcome.price_changed === expect.priceChanged : true,
        expect.cancelError !== undefined ? outcome.cancel_error === expect.cancelError : true,
        // Successful test bookings must also be cancelled (sandbox clean-up)
        scenario.cancelAfter && expect.cancelError === undefined && outcome.status === "confirmed" ? outcome.cancel_error === null : true,
    ]
    result.expected = expect
    result.informational = Boolean(scenario.informational)
    result.passed = !result.error && checks.every(Boolean)
    result.finished_at = new Date().toISOString()
    fs.writeFileSync(path.join(RUN_DIR, `${scenario.id}.json`), JSON.stringify(result, null, 2))
    return result
}

function writeSummary(results) {
    const row = (result) => {
        const outcome = result.outcome ?? {}
        const observed = result.error
            ? `error: ${result.error}`
            : [outcome.status, outcome.etg_status && outcome.etg_status !== "ok" ? `(${outcome.etg_status})` : null, outcome.price_changed ? "price changed at prebook" : null, outcome.cancel_error !== undefined ? `cancel: ${outcome.cancel_error ?? "ok"}` : null].filter(Boolean).join(" ")
        return `| ${result.passed ? "PASS" : result.informational ? "INFO" : "FAIL"} | ${result.title} | ${outcome.partner_order_id ?? "-"} | ${outcome.etg_order_id ?? "-"} | ${observed} | [log](runs/${RUN_ID}/${result.id}.json) |`
    }
    const markdown = `# RateHawk (ETG) certification test cases

Run: **${RUN_ID}** against \`${rtConfigs.apiUrl}\` (sandbox), key id ${rtConfigs.apiKeyId}.
Stay used: ${CHECKIN} to ${CHECKOUT}. Generated by \`node src/scripts/ratehawk-certification.js\`.

Every case runs through the production code path used by customers:
hotelpage → prebook (\`price_increase_percent\`) → checkout (guest names, payment) → payment confirmed →
\`/hotel/order/booking/form/\` → \`/hotel/order/booking/finish/\` → \`/hotel/order/booking/finish/status/\` (polled) →
\`/hotel/order/info/\` → \`/hotel/order/cancel/\`. The full ETG request/response JSON for each case is in its log file.

| Result | Case | partner_order_id | ETG order_id | Observed | Log |
|---|---|---|---|---|---|
${results.map(row).join("\n")}

## Requirements covered

${results.map((result) => `- **${result.title}**: ${result.requirement}`).join("\n")}

## Integration notes for the API team

- **Payment model:** B2B deposit. The guest pays Holidaywaka first (Unified Payment card checkout or bank transfer); the ETG booking starts only after the payment is confirmed, and is paid from our deposit (\`payment_type.type = deposit\`).
- **Final status:** Check booking process is polled every ${Number(process.env.RATEHAWK_STATUS_POLL_MS)} ms until \`ok\` or a final error, with one last request just before the booking cut-off; the receive-booking-status webhook (\`POST /api/hotels/bookings/webhook\`, HMAC-SHA256 signature verified) is implemented as a second channel.
- **Retries:** booking form retried with a new \`partner_order_id\` on \`double_booking_form\`, \`duplicate_reservation\`, \`timeout\`, \`unknown\` and 5xx (max 10); finish errors \`timeout\`/\`unknown\`/5xx continue to status checks.
- **Expired hash after a slow bank transfer:** a fresh hotelpage + prebook of the same rate (\`match_hash\`) is used, only if the supplier price did not increase.
- **Price changes:** prebook uses \`price_increase_percent\`; the new price is shown to the guest before payment.
- **Guests:** all adult names per room are sent; children are sent with \`is_child\` and the searched age; residency is sent in every search.
- **Email in Start booking process:** one fixed corporate address (${process.env.RATEHAWK_BOOKING_EMAIL || process.env.MAIL_USER}).
- **Post-booking:** order info for the hotel confirmation number, cancellation, and voucher download (\`/hotel/order/document/voucher/download/\`).
`
    fs.writeFileSync(path.join(OUT_DIR, "README.md"), markdown)
    fs.writeFileSync(path.join(RUN_DIR, "summary.json"), JSON.stringify(results.map(({ exchanges, ...rest }) => rest), null, 2))
}

const only = process.argv.slice(2)
const selected = only.length ? SCENARIOS.filter((scenario) => only.includes(scenario.id)) : SCENARIOS
const results = []
for (const scenario of selected) {
    console.log(`\n▶ ${scenario.title}`)
    const result = await runScenario(scenario)
    console.log(`  ${result.passed ? "PASS" : "FAIL"} ${result.error ?? JSON.stringify(result.outcome ?? {}).slice(0, 200)}`)
    results.push(result)
}
writeSummary(results)
console.log(`\n${results.filter((result) => result.passed).length}/${results.length} passed. Summary: ${path.join(OUT_DIR, "README.md")}`)
process.exit(results.every((result) => result.passed) ? 0 : 1)
