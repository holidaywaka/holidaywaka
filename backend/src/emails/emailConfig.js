
import nodemailer from "nodemailer"
import hbs from 'nodemailer-express-handlebars'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from "dotenv"

dotenv.config()


const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    pool: true, // ♻️  enable connection pooling
    maxConnections: 5, // optional – defaults to 5
    maxMessages: 100, // optional – defaults to 100
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});


// Templates sit next to this file
const templatesDir = path.dirname(fileURLToPath(import.meta.url))

const options = {
    viewEngine: {
        extName: '.handlebars',
        partialsDir: templatesDir,
        defaultLayout: false
    },
    viewPath: templatesDir,
    extName: '.handlebars'
}

transporter.use('compile', hbs(options))

// `context` carries template-specific data (e.g. sections/totals for transaction.handlebars)
const SendMail = async ({ mailTo, subject, template, content, fullname, message, message2, context = {} }) => {
    try {
        await transporter.sendMail({
            from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_USER}>`,
            to: mailTo,
            subject: subject,
            template,
            context: {
                ...context,
                subject,
                fullname,
                message,
                message2,
                content,
                MAIL_NAME: process.env.MAIL_NAME,
                MAIL_USER: process.env.MAIL_USER,
            },
        });
    } catch (error) {
        console.log(error)
    }
}

// Worker jobs close the pool when done so the worker thread can exit
export const closeMailer = () => transporter.close()

export default SendMail

