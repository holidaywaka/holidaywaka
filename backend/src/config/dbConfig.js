import { Sequelize } from "sequelize"
import logger from "../middleware/logger.js";
import dotenv from "dotenv"

dotenv.config()

export const isProduction = process.env.ENVIRONMENT !== "development"

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  logging: (msg) => logger.debug(msg)
});


export default sequelize
