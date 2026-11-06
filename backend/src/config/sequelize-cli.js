// Connection settings for sequelize-cli (migrations). Mirrors config/dbConfig.js.
import dotenv from "dotenv"

dotenv.config()

const connection = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    migrationStorageTableName: "SequelizeMeta",
}

export default {
    development: connection,
    test: connection,
    production: connection,
}
