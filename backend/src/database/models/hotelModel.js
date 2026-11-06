import { DataTypes } from "sequelize"
import { jsonColumn } from "./hotelModelUtils.js"

export const HotelContentStatus = {
    pending: "pending",         // hid known (from hotel_ids_by_filter or search) but content not fetched yet
    synced: "synced",           // content stored locally
    unavailable: "unavailable", // ETG returned no content for this hid
}

// Local copy of ETG static hotel content (Content API: hotel_content_by_ids).
// Search and hotelpage responses only carry rates; everything displayed about
// the property itself is read from here, never fetched from ETG in real time.
function hotelModelFn(sequelize) {
    return sequelize.define("Hotels", {
        hid: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false,
        },
        legacyId: DataTypes.STRING,
        name: DataTypes.STRING,
        kind: DataTypes.STRING(64),
        starRating: { type: DataTypes.INTEGER, defaultValue: 0 },
        hotelChain: DataTypes.STRING,
        address: DataTypes.STRING(512),
        postalCode: DataTypes.STRING(64),
        phone: DataTypes.STRING(128),
        email: DataTypes.STRING,
        latitude: DataTypes.DOUBLE,
        longitude: DataTypes.DOUBLE,
        regionId: DataTypes.BIGINT,
        countryCode: DataTypes.STRING(2),
        checkInTime: DataTypes.STRING(8),
        checkInTimeEnd: DataTypes.STRING(8),
        checkOutTime: DataTypes.STRING(8),
        frontDeskTimeStart: DataTypes.STRING(8),
        frontDeskTimeEnd: DataTypes.STRING(8),
        isClosed: { type: DataTypes.BOOLEAN, defaultValue: false },
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
        isGenderSpecificationRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
        images: jsonColumn(DataTypes, "images", []),
        amenityGroups: jsonColumn(DataTypes, "amenityGroups", []),
        descriptionStruct: jsonColumn(DataTypes, "descriptionStruct", []),
        // metapolicy_struct and metapolicy_extra_info must be shown to the end user (ETG requirement)
        metapolicyStruct: jsonColumn(DataTypes, "metapolicyStruct", null),
        metapolicyExtraInfo: DataTypes.TEXT,
        policyStruct: jsonColumn(DataTypes, "policyStruct", []),
        roomGroups: jsonColumn(DataTypes, "roomGroups", []),
        serpFilters: jsonColumn(DataTypes, "serpFilters", []),
        facts: jsonColumn(DataTypes, "facts", null),
        keysPickup: jsonColumn(DataTypes, "keysPickup", null),
        paymentMethods: jsonColumn(DataTypes, "paymentMethods", null),
        starCertificate: jsonColumn(DataTypes, "starCertificate", null),
        language: DataTypes.STRING(8),
        contentStatus: { type: DataTypes.STRING(16), defaultValue: HotelContentStatus.pending },
        contentSyncedAt: DataTypes.DATE,
    }, {
        indexes: [
            { fields: ["regionId"] },
            { fields: ["name"] },
            { fields: ["contentStatus"] },
        ]
    })
}

export default hotelModelFn
