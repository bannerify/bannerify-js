import pMap from "p-map"
import { createClient } from "../src"
import fs from "fs/promises"
const client = createClient(process.env.API_KEY!, {
  timeout: 60000,
})

let total = 0

setInterval(() => {
  console.log(total)
}, 3e3)

const results = await pMap(
  Array.from({ length: 1000 }, (_, i) => i),
  async (i) => {
    const time = Date.now()
    const result = await client.createImage("tpl_iCvSUAtrcU", {
      // nocache: true,
      // format: 'svg',
      // modifications: [{ name: "Table", rows: [] }],
      modifications: [{ name: "Text 3", text: "Hello + " + i }],
    })
    if (result.error) {
      console.log(result.error)
      process.exit(1)
    }
    console.log("res", Date.now() - time)
    try {
      await fs.writeFile(
        `./playground/output/benchmark-${i % 10}.png`,
        Buffer.from(result.result as ArrayBuffer),
      )
    } catch (e) {
      console.log(e, result)
    }
    total++
  },
  {
    concurrency: 10,
  },
)
