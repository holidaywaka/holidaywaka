
import Bree from "bree"
import path from "path"
import { fileURLToPath } from "url"



const bree = new Bree({
  // Bree resolves its default root against the working directory; job files live here
  root: path.dirname(fileURLToPath(import.meta.url)),
  removeCompleted: true,
  jobs: [
    {
      name: "sample",
    }
  ]
})


export default bree

