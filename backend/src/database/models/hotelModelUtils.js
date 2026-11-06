import { safeParse } from "../../config/utilities.js"

// JSON column that tolerates drivers returning JSON as a string (e.g. MariaDB LONGTEXT)
export const jsonColumn = (DataTypes, field, fallback) => {
    return {
        type: DataTypes.JSON,
        get() {
            const raw = this.getDataValue(field)
            if (raw === null || raw === undefined || raw === "") return fallback
            if (typeof raw === "object") return raw
            const parsed = safeParse(raw)
            return parsed ?? fallback
        }
    }
}
