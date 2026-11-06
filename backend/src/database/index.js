import { Sequelize, DataTypes } from "sequelize"
import sequelize from "../config/dbConfig.js"
import logger from "../middleware/logger.js"
import userModelFn from "./models/userModel.js"
import bankModelFn from "./models/bankModel.js"
import contactModelFn from "./models/contactModel.js"
import tripModelFn from "./models/tripModel.js"
import tripEnquiryModelFn from "./models/tripenquiryModel.js"
import transactionModelFn from "./models/transactionModel.js"
import transactionTimelineModelFn from "./models/transactiontimelineModel.js"
import blogModelFn from "./models/blogModel.js"
import markupModelFn from "./models/markupModel.js"
import newsletterModelFn from "./models/newletterModel.js"
import notifyModelFn from "./models/notifyModel.js"
import rateModelFn from "./models/rateModel.js"
import socialModelFn from "./models/socialModel.js"
import transferModelFn from "./models/transferModel.js"
import visaCountryModelFn from "./models/visacountry.js"
import visaEnquiryModelFn from "./models/visaEnquiry.js"
import voucherLogModelFn from "./models/voucherlogModel.js"
import voucherModelFn from "./models/voucherModel.js"
import docsModelFn from "./models/docsModel.js"
import hotelModelFn from "./models/hotelModel.js"
import hotelRegionModelFn from "./models/hotelRegionModel.js"
import hotelStaticDataModelFn from "./models/hotelStaticDataModel.js"
import hotelSyncLogModelFn from "./models/hotelSyncLogModel.js"
import hotelPrebookModelFn from "./models/hotelPrebookModel.js"
import hotelBookingModelFn from "./models/hotelBookingModel.js"


async function initializeDatabase() {
    try {
        await sequelize.authenticate()
        logger.info('✅ Database connection has been established successfully.')
        // Schema is managed by migrations (npm run db:migrate), not sequelize.sync()
    } catch (error) {
        logger.error('❌ Unable to connect to the database:', error)
    }
}


const db = {
    sequelize: sequelize,
    Sequelize: Sequelize,

    Users: userModelFn(sequelize),
    Banks: bankModelFn(sequelize),
    Contacts: contactModelFn(sequelize),
    Trips: tripModelFn(sequelize),
    TripEnquiries: tripEnquiryModelFn(sequelize),
    Transactions: transactionModelFn(sequelize),
    TransactionTimelines: transactionTimelineModelFn(sequelize),
    Blogs: blogModelFn(sequelize),
    Markups: markupModelFn(sequelize),
    NewsLetters: newsletterModelFn(sequelize),
    Notifies: notifyModelFn(sequelize),
    Rates: rateModelFn(sequelize),
    Socials: socialModelFn(sequelize),
    Transfers: transferModelFn(sequelize),
    VisaCountries: visaCountryModelFn(sequelize),
    VisaEnquiries: visaEnquiryModelFn(sequelize),
    VoucherLogs: voucherLogModelFn(sequelize),
    Vouchers: voucherModelFn(sequelize),
    Docs: docsModelFn(sequelize),
    Hotels: hotelModelFn(sequelize),
    HotelRegions: hotelRegionModelFn(sequelize),
    HotelStaticData: hotelStaticDataModelFn(sequelize),
    HotelSyncLogs: hotelSyncLogModelFn(sequelize),
    HotelPrebooks: hotelPrebookModelFn(sequelize),
    HotelBookings: hotelBookingModelFn(sequelize),
}

db.Trips.hasMany(db.TripEnquiries, { foreignKey: 'tripId' })
db.TripEnquiries.hasMany(db.Transactions, { foreignKey: 'tripId' })
db.Transfers.hasMany(db.Transactions, { foreignKey: 'transferId' })
db.VisaEnquiries.hasOne(db.Transactions, { foreignKey: 'visaId' })
db.Transactions.hasMany(db.TransactionTimelines, { foreignKey: 'transactionId', constraints: false })


db.TripEnquiries.belongsTo(db.Trips, { foreignKey: 'tripId' })
db.Transactions.belongsTo(db.TripEnquiries, { foreignKey: 'tripId' })
db.Transactions.belongsTo(db.Transfers, { foreignKey: 'transferId' })
db.Transactions.belongsTo(db.VisaEnquiries, { foreignKey: 'visaId' })
db.TransactionTimelines.belongsTo(db.Transactions, { foreignKey: 'transactionId', constraints: false })

// Hotel content is upserted in bulk from ETG, so relations are not enforced at the DB level
db.HotelRegions.hasMany(db.Hotels, { foreignKey: 'regionId', constraints: false })
db.Hotels.belongsTo(db.HotelRegions, { foreignKey: 'regionId', constraints: false })
db.Hotels.hasMany(db.HotelPrebooks, { foreignKey: 'hid', constraints: false })
db.HotelPrebooks.belongsTo(db.Hotels, { foreignKey: 'hid', constraints: false })
db.HotelBookings.belongsTo(db.HotelPrebooks, { foreignKey: 'prebookId', constraints: false })
db.HotelBookings.belongsTo(db.Transactions, { foreignKey: 'transactionId', constraints: false })
db.Transactions.belongsTo(db.HotelBookings, { foreignKey: 'hotelBookingId', constraints: false })

// Resolves once the connection is up; standalone scripts await it before querying
db.ready = initializeDatabase()

export default db
