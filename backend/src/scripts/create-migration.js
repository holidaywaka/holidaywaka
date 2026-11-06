// Usage: npm run migration:create -- add-column-to-users
//        npm run seed:create -- default-admin
// Writes a timestamped ES module migration/seeder. Don't use sequelize-cli's migration:generate or
// seed:generate: they emit CommonJS, which fails in this "type": "module" package.
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const args = process.argv.slice(2)
const isSeed = args.includes("--seed")
const name = args.find((arg) => !arg.startsWith("--"))
if (!name) {
    console.error(`Usage: npm run ${isSeed ? "seed" : "migration"}:create -- <name>`)
    process.exit(1)
}

const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14)
const folder = isSeed ? "../database/seeders" : "../database/migrations"
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), folder, `${timestamp}-${name}.js`)

fs.writeFileSync(file, `export default {
    async up(queryInterface, Sequelize) {
    },

    async down(queryInterface, Sequelize) {
    },
}
`)

console.log(`Created ${path.relative(process.cwd(), file)}`)
