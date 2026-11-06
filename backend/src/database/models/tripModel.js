
import { DataTypes } from "sequelize";
import { ModelIDFormat, MainStatusOptions, dbStringToJson } from "../../config/utilities.js";

function tripModelFn(sequelize) {
  return sequelize.define('Trip', {
    id: ModelIDFormat(DataTypes),
    title: DataTypes.TEXT,
    summary: DataTypes.TEXT,
    tripType: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: MainStatusOptions.true },
    startDate: DataTypes.STRING,
    endDate: DataTypes.STRING,
    description: DataTypes.TEXT,
    slug: DataTypes.TEXT,
    fulfillmentStatus: DataTypes.STRING,
    duplicate: { type: DataTypes.STRING, defaultValue: MainStatusOptions.false },
    // Visa: when required, the earliest travel date is the visa-ready date (business days) plus one day
    visaRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    visaProcessingDays: { type: DataTypes.INTEGER, defaultValue: 0 },
    destinations: {
      type: DataTypes.JSON,
      get() {
        return dbStringToJson(this.getDataValue('destinations'))
      }
    }, // country, city
    itineraries: {
      type: DataTypes.JSON,
      get() {
        return dbStringToJson(this.getDataValue('itineraries'))
      }
    }, // content
    inclusions: {
      type: DataTypes.JSON,
      get() {
        return dbStringToJson(this.getDataValue('inclusions'))
      }
    }, // content
    prices: {
      type: DataTypes.JSON,
      get() {
        return dbStringToJson(this.getDataValue('prices'))
      }
    }, // price, priceType
    images: {
      type: DataTypes.JSON,
      get() {
        return dbStringToJson(this.getDataValue('images'))
      }
    }, // string[]
  })
}

export default tripModelFn