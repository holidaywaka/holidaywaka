
import bree from "../jobs/index.js"
import path from "path"
import { fileURLToPath } from "url"
import crypto from "crypto"
import logger from "../middleware/logger.js"


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export const JOB_FILES = {
  hash_password: "hash-password.js",
  notify: "notifyJob.js",
  email: "emailJobs.js",
  trip_images: "tripImagesJob.js",
}

// bree.init() replaces config.jobs, so concurrent first calls to add() lose their jobs; init exactly once
let breeInit
const initBree = () => (breeInit ??= bree.init())

export function runJobs(baseName, fileName, body) {
  // unique suffix so concurrent calls never share (and remove) the same job
  const jobName = `${baseName}-${crypto.randomUUID()}`

  async function runner() {
    await initBree()
    await bree.add([
      {
        name: jobName,
        path: path.join(__dirname, "../jobs", fileName),
        worker: {
          workerData: body
        }
      }
    ])
    await bree.run(jobName)
  }

  runner().catch((error) => logger.error(error, `Failed to run job ${jobName}`))
}




// async function removeJobIfExists(breeInstance, jobName) {
//   if (!breeInstance) {
//     throw new Error("[JobManager] Bree instance is required");
//   }

//   const existingJobs = breeInstance.config?.jobs || [];

//   // Check if job exists in config (can be string or object with .name)
//   const jobExists = existingJobs.some((job) =>
//     typeof job === 'string' ? job === jobName : job.name === jobName
//   );

//   if (jobExists) {
//     try {
//       // Try stopping active worker if running (ignore error if not currently active)
//       await breeInstance.stop(jobName).catch(() => { });

//       // Remove job from Bree scheduler
//       await breeInstance.remove(jobName);
//     } catch (err) {
//       console.error(`[JobManager] Failed to tear down existing job '${jobName}':`, err);
//       throw err;
//     }
//   }
// }

// export const runJobs = async (jobName, fileName, body) => {
//   try {
//     // FIXED: Pass `bree` instance as first argument
//     await removeJobIfExists(bree, jobName);

//     // Add the new job definition
//     await bree.add({
//       name: jobName,
//       path: path.join(__dirname, "../jobs", fileName),
//       worker: {
//         workerData: body
//       }
//     });

//     // Start or run job
//     await bree.start(jobName);

//   } catch (error) {
//     console.error(`Bree Error (Job: ${jobName}):`, error);
//     throw error;
//   }
// };