import { workerData } from "worker_threads"
import SendMail, { closeMailer } from "../emails/emailConfig.js"

async function runWorker() {
    // treat all as an array
    const body = workerData.body

    for (const item of body) {
        await SendMail({...item})
    }

    closeMailer()
}

runWorker()
