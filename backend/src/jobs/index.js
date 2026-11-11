import Bree from "bree"
import path from "path"
import { fileURLToPath } from "url"
import { deleteCache } from "../config/cacheConfig.js"
import logger from "../middleware/logger.js"



const bree = new Bree({
  // Bree resolves its default root against the working directory; job files live here
  root: path.dirname(fileURLToPath(import.meta.url)),
  removeCompleted: true,
  // Workers have their own memory, so they ask the main process to clear its caches
  workerMessageHandler: ({ name, message }) => {
    if (Array.isArray(message?.clearCache)) return message.clearCache.forEach((key) => deleteCache(key))
    if (message !== "done") logger.info(`Job ${name} sent a message: ${JSON.stringify(message)}`)
  },
  jobs: [
    {
      name: "sample",
    }
  ]
})


export default bree
