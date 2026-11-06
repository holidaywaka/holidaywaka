/**
 * Baseline schema: every table that existed while the app relied on sequelize.sync().
 *
 * Safe to run against a database that sync already created: existing tables are not
 * recreated, only columns and indexes missing from them are added (nothing is altered
 * or dropped). Foreign keys are never added to columns that already exist, because that can
 * fail on orphaned rows; a missing FK column is added with its constraint (it starts all NULL).
 *
 * Column definitions are frozen here on purpose. Change the schema with a new migration,
 * not by editing this file or relying on the models.
 */

const tables = (S) => {
    const uuidId = () => ({ type: S.UUID, allowNull: false, primaryKey: true })
    const bigintKey = () => ({ type: S.BIGINT, allowNull: false, primaryKey: true, autoIncrement: false })
    const status = (defaultValue) => ({ type: S.STRING, defaultValue })
    // Matches the constraints sync() derived from the hasMany/belongsTo pairs in models/index.js
    const fk = (table) => ({
        type: S.UUID,
        references: { model: table, key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })

    return [
        {
            name: "Users",
            columns: {
                id: uuidId(),
                firstName: S.STRING,
                lastName: S.STRING,
                email: S.STRING,
                phone: S.STRING,
                dialCode: S.STRING,
                password: S.STRING,
                otpExpiry: S.DATE,
                otp: S.STRING,
                emailVerified: status("false"),
                role: status("USER"),
            },
        },
        {
            name: "Banks",
            columns: {
                id: { type: S.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
                accountName: S.STRING,
                accountNumber: S.STRING,
                bankName: S.STRING,
                status: status("true"),
            },
        },
        {
            name: "Contacts",
            columns: {
                id: uuidId(),
                name: S.STRING,
                contact: S.STRING,
                message: S.TEXT,
            },
        },
        {
            name: "Trips",
            columns: {
                id: uuidId(),
                title: S.TEXT,
                summary: S.TEXT,
                tripType: S.STRING,
                status: status("true"),
                startDate: S.STRING,
                endDate: S.STRING,
                description: S.TEXT,
                slug: S.TEXT,
                fulfillmentStatus: S.STRING,
                duplicate: status("false"),
                visaRequired: { type: S.BOOLEAN, defaultValue: false },
                visaProcessingDays: { type: S.INTEGER, defaultValue: 0 },
                destinations: S.JSON,
                itineraries: S.JSON,
                inclusions: S.JSON,
                prices: S.JSON,
                images: S.JSON,
            },
        },
        {
            name: "TripEnquiries",
            columns: {
                id: uuidId(),
                userId: S.UUID,
                tripId: fk("Trips"),
                travelDate: S.STRING,
                message: S.STRING,
                status: S.STRING,
                tripType: S.STRING,
                travelers: S.JSON,
                totalPrice: S.FLOAT,
            },
        },
        {
            name: "Transfers",
            columns: {
                id: uuidId(),
                trips: S.JSON,
                date_change: S.STRING,
                pickup_type: S.STRING,
                date: S.STRING,
                date_arrival: S.STRING,
                user_id: S.STRING,
                order_id: S.STRING,
                order_type: S.STRING,
                transaction: S.STRING,
                payable_status: S.STRING,
                status: S.STRING,
                ex_order_status: S.STRING,
                charge: S.JSON,
                payable: S.STRING,
                markup: S.STRING,
                bookingCode: S.STRING,
                allowable_booking_time: S.STRING,
                cancellation_time: S.STRING,
                currency: S.STRING,
                price_id: S.FLOAT,
                price: S.FLOAT,
                car_title: S.STRING,
                car_capacity: S.STRING,
                car_models: S.STRING,
                car_photo: S.STRING,
                car_class_id: S.FLOAT,
                passengers: S.JSON,
                total_adults: S.FLOAT,
                total_children: S.FLOAT,
                coordinator_name: S.STRING,
                coordinator_phone: S.STRING,
                additional_services: S.JSON,
                viewers: S.JSON,
                driver_data: S.JSON,
                service_provider: S.STRING,
                fare_on_toll_road: S.STRING,
                service_id: S.STRING,
                cancellation_time_without_penalty: S.STRING,
                origin: S.JSON,
                destination: S.JSON,
                duration: S.INTEGER,
                flexible_tariff: S.STRING,
                is_fast_ride: S.STRING,
                flexible_tariff_agreement: S.STRING,
            },
        },
        {
            name: "VisaEnquiries",
            columns: {
                id: uuidId(),
                firstName: S.STRING,
                lastName: S.STRING,
                email: S.STRING,
                phone: S.STRING,
                nationality: S.STRING,
                visa: S.JSON,
                hasPassport: S.STRING,
                passportNumber: S.STRING,
                travelDate: S.DATE,
                message: S.TEXT,
                status: status("Pending"),
            },
        },
        {
            name: "Transactions",
            columns: {
                id: uuidId(),
                userId: S.UUID,
                tripId: fk("TripEnquiries"),
                transferId: fk("Transfers"),
                visaId: fk("VisaEnquiries"),
                hotelBookingId: S.UUID,
                isVoucher: S.UUID,
                txType: S.TEXT,
                txid: S.TEXT,
                image: S.TEXT,
                amount: S.DOUBLE,
                charge: S.JSON,
                orderId: S.STRING,
                declineReason: S.TEXT,
                discount: { type: S.DOUBLE, defaultValue: 0 },
                voucherCode: S.STRING,
                notifiedStatus: S.STRING,
                gatewayResponse: S.JSON,
                gatewayStatus: S.STRING,
                status: status("OPEN"),
                paymentStatus: status("PENDING"),
                paymentType: status("DIRECT_BANK_TRANSFER"),
            },
        },
        {
            name: "TransactionTimelines",
            columns: {
                id: uuidId(),
                transactionId: S.UUID,
                paid: S.DOUBLE,
                balance: S.DOUBLE,
                datePaid: S.DATE,
            },
        },
        {
            name: "Blogs",
            columns: {
                id: uuidId(),
                title: S.STRING,
                url: S.TEXT,
                read: S.STRING,
                content: S.TEXT,
                slug: S.TEXT,
                media: S.STRING,
                status: status("true"),
            },
        },
        {
            name: "Markups",
            columns: {
                id: uuidId(),
                tag: S.STRING,
                currency: S.STRING,
                discountType: S.STRING,
                discountValue: { type: S.FLOAT, defaultValue: 0 },
                vat: { type: S.FLOAT, defaultValue: 0 },
                status: status("true"),
            },
        },
        {
            name: "NewsLetters",
            columns: {
                id: uuidId(),
                email: S.STRING,
            },
        },
        {
            name: "Notifies",
            columns: {
                id: uuidId(),
                userId: S.UUID,
                title: S.STRING,
                content: S.TEXT,
            },
        },
        {
            name: "Rates",
            columns: {
                id: uuidId(),
                source: S.STRING,
                quotes: S.JSON,
                status: S.STRING,
            },
        },
        {
            name: "Socials",
            columns: {
                id: uuidId(),
                tag: S.STRING,
                link: S.TEXT,
                status: status("true"),
            },
        },
        {
            name: "VisaCountries",
            columns: {
                id: uuidId(),
                country: S.STRING,
                fee: S.STRING,
                status: status("true"),
                destinations: S.JSON,
            },
        },
        {
            name: "VoucherLogs",
            columns: {
                id: uuidId(),
                voucherID: S.UUID,
                memberId: S.UUID,
                email: S.STRING,
                status: status("true"),
                date: S.DATE,
                expiry: S.DATE,
                discountValueText: S.STRING,
                discountTypeText: S.STRING,
                discountType: S.STRING,
                discountedValue: S.FLOAT,
                priceCharge: S.FLOAT,
                transactionId: S.UUID,
            },
        },
        {
            name: "Vouchers",
            columns: {
                id: uuidId(),
                code: S.STRING,
                discountType: S.STRING,
                discountValue: { type: S.FLOAT, defaultValue: 0 },
                expirationDate: S.DATE,
                maxUsageCount: { type: S.INTEGER, defaultValue: 0 },
                currentUsageCount: { type: S.INTEGER, defaultValue: 0 },
                accountId: S.TEXT,
                service: S.STRING,
                status: status("true"),
            },
        },
        {
            name: "Docs",
            columns: {
                id: uuidId(),
                tag: S.STRING,
                content: S.TEXT,
                status: status("true"),
            },
        },
        {
            name: "Hotels",
            columns: {
                hid: bigintKey(),
                legacyId: S.STRING,
                name: S.STRING,
                kind: S.STRING(64),
                starRating: { type: S.INTEGER, defaultValue: 0 },
                hotelChain: S.STRING,
                address: S.STRING(512),
                postalCode: S.STRING(64),
                phone: S.STRING(128),
                email: S.STRING,
                latitude: S.DOUBLE,
                longitude: S.DOUBLE,
                regionId: S.BIGINT,
                countryCode: S.STRING(2),
                checkInTime: S.STRING(8),
                checkInTimeEnd: S.STRING(8),
                checkOutTime: S.STRING(8),
                frontDeskTimeStart: S.STRING(8),
                frontDeskTimeEnd: S.STRING(8),
                isClosed: { type: S.BOOLEAN, defaultValue: false },
                deleted: { type: S.BOOLEAN, defaultValue: false },
                isGenderSpecificationRequired: { type: S.BOOLEAN, defaultValue: false },
                images: S.JSON,
                amenityGroups: S.JSON,
                descriptionStruct: S.JSON,
                metapolicyStruct: S.JSON,
                metapolicyExtraInfo: S.TEXT,
                policyStruct: S.JSON,
                roomGroups: S.JSON,
                serpFilters: S.JSON,
                facts: S.JSON,
                keysPickup: S.JSON,
                paymentMethods: S.JSON,
                starCertificate: S.JSON,
                language: S.STRING(8),
                contentStatus: { type: S.STRING(16), defaultValue: "pending" },
                contentSyncedAt: S.DATE,
            },
            indexes: [["regionId"], ["name"], ["contentStatus"]],
        },
        {
            name: "HotelRegions",
            columns: {
                id: bigintKey(),
                name: S.STRING,
                type: S.STRING(64),
                countryCode: S.STRING(2),
                iata: S.STRING(8),
                hotelsCount: { type: S.INTEGER, defaultValue: 0 },
            },
            indexes: [["name"]],
        },
        {
            name: "HotelStaticData",
            columns: {
                key: { type: S.STRING(64), allowNull: false, primaryKey: true },
                data: S.JSON,
                syncedAt: S.DATE,
            },
        },
        {
            name: "HotelSyncLogs",
            columns: {
                id: uuidId(),
                scope: S.STRING(16),
                status: { type: S.STRING(16), defaultValue: "running" },
                params: S.JSON,
                stats: S.JSON,
                error: S.TEXT,
                startedAt: S.DATE,
                finishedAt: S.DATE,
            },
            indexes: [["scope", "status", "startedAt"]],
        },
        {
            name: "HotelPrebooks",
            columns: {
                id: uuidId(),
                hid: S.BIGINT,
                hotelName: S.STRING,
                requestedHash: S.STRING(256),
                bookHash: S.STRING(256),
                priceIncreasePercent: { type: S.INTEGER, defaultValue: 0 },
                priceChanged: { type: S.BOOLEAN, defaultValue: false },
                originalAmount: S.DECIMAL(14, 2),
                amount: S.DECIMAL(14, 2),
                currency: S.STRING(3),
                netAmount: S.DECIMAL(14, 2),
                netCurrency: S.STRING(3),
                contractAmount: S.DECIMAL(14, 2),
                contractCurrency: S.STRING(3),
                exchangeRate: { type: S.DECIMAL(14, 4), defaultValue: 1 },
                markup: S.JSON,
                checkin: S.DATEONLY,
                checkout: S.DATEONLY,
                residency: S.STRING(2),
                guests: S.JSON,
                rate: S.JSON,
                expiresAt: S.DATE,
            },
            indexes: [["bookHash"]],
        },
        {
            name: "HotelBookings",
            columns: {
                id: uuidId(),
                reference: S.STRING(32),
                transactionId: S.UUID,
                prebookId: S.UUID,
                hid: S.BIGINT,
                hotelName: S.STRING,
                hotelAddress: S.STRING,
                regionName: S.STRING,
                status: { type: S.STRING(32), defaultValue: "awaiting_payment" },
                etgStatus: S.STRING(64),
                failureReason: S.TEXT,
                partnerOrderId: S.STRING(64),
                partnerOrderIds: S.JSON,
                etgOrderId: S.BIGINT,
                etgItemId: S.BIGINT,
                bookHash: S.STRING(256),
                hotelConfirmationNumber: S.STRING(128),
                supplierConfirmationId: S.STRING(128),
                checkin: S.DATEONLY,
                checkout: S.DATEONLY,
                residency: S.STRING(2),
                guests: S.JSON,
                rooms: S.JSON,
                roomName: S.STRING,
                mealLabel: S.STRING,
                rate: S.JSON,
                freeCancellationBefore: S.DATE,
                firstName: S.STRING,
                lastName: S.STRING,
                email: S.STRING,
                phone: S.STRING(40),
                comment: S.TEXT,
                userIp: S.STRING(64),
                amount: S.DECIMAL(14, 2),
                discount: { type: S.DECIMAL(14, 2), defaultValue: 0 },
                currency: S.STRING(3),
                netAmount: S.DECIMAL(14, 2),
                netCurrency: S.STRING(3),
                contractAmount: S.DECIMAL(14, 2),
                contractCurrency: S.STRING(3),
                exchangeRate: { type: S.DECIMAL(14, 4), defaultValue: 1 },
                markup: S.JSON,
                etgPaymentType: S.STRING(16),
                voucherCode: S.STRING(64),
                cancellation: S.JSON,
                orderInfo: S.JSON,
                bookingStartedAt: S.DATE,
                statusCheckedAt: S.DATE,
                confirmedAt: S.DATE,
                failedAt: S.DATE,
                cancelledAt: S.DATE,
                events: S.JSON,
            },
            indexes: [["status"], ["partnerOrderId"], ["transactionId"], ["reference"]],
        },
    ].map((table) => ({
        ...table,
        columns: {
            ...table.columns,
            createdAt: { type: S.DATE, allowNull: false },
            updatedAt: { type: S.DATE, allowNull: false },
        },
        indexes: table.indexes || [],
    }))
}

const sameFields = (a, b) => a.length === b.length && a.every((field, i) => field.toLowerCase() === b[i].toLowerCase())

export default {
    async up(queryInterface, Sequelize) {
        // MySQL on Windows/macOS reports table names in lowercase
        const existing = new Map(
            (await queryInterface.showAllTables()).map((name) => [String(name).toLowerCase(), name])
        )

        for (const table of tables(Sequelize)) {
            const actualName = existing.get(table.name.toLowerCase())

            if (!actualName) {
                await queryInterface.createTable(table.name, table.columns)
                for (const fields of table.indexes) await queryInterface.addIndex(table.name, fields)
                continue
            }

            const described = await queryInterface.describeTable(actualName)
            const present = new Set(Object.keys(described).map((column) => column.toLowerCase()))
            for (const [column, definition] of Object.entries(table.columns)) {
                if (!present.has(column.toLowerCase())) await queryInterface.addColumn(actualName, column, definition)
            }

            const currentIndexes = (await queryInterface.showIndex(actualName)).map((index) =>
                index.fields.map((field) => field.attribute)
            )
            for (const fields of table.indexes) {
                if (!currentIndexes.some((current) => sameFields(current, fields))) {
                    await queryInterface.addIndex(actualName, fields)
                }
            }
        }
    },

    async down(queryInterface, Sequelize) {
        for (const table of tables(Sequelize).reverse()) await queryInterface.dropTable(table.name)
    },
}
