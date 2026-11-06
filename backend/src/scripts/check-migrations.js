// Runs before the db:* scripts. Migrations and seeders must be ES modules (export default { up, down });
// a CommonJS file (e.g. from sequelize-cli's migration:generate) would fail midway with "module is not defined".
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const database = path.join(path.dirname(fileURLToPath(import.meta.url)), "../database")
const commonJs = /\bmodule\.exports\b|\bexports\.\w+\s*=|\brequire\s*\(/

const offenders = ["migrations", "seeders"].flatMap((folder) => {
    const dir = path.join(database, folder)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
        .filter((file) => file.endsWith(".js") && commonJs.test(fs.readFileSync(path.join(dir, file), "utf8")))
        .map((file) => `src/database/${folder}/${file}`)
})

if (offenders.length) {
    console.error("These files use CommonJS, but migrations and seeders must be ES modules:")
    for (const file of offenders) console.error(`  ${file}`)
    console.error('Use "export default { async up() {}, async down() {} }" (npm run migration:create / seed:create generates it).')
    process.exit(1)
}
