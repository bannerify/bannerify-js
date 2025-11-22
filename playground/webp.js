import { createClient } from "bannerify-node"
import * as fs from "node:fs"

const client = createClient({
  apiKey: "",
  baseUrl: "http://localhost:8788/v1",
})

try {
  const result = await client.createImage("tpl_E99d1wLEL1", {
    format: "webp",
  })
  console.log(result)
  await fs.promises.writeFile(
    "playground/output/sample.webp",
    Buffer.from(result.result ?? result),
  )
} catch (e) {
  console.error(e)
  if (e?.response) {
    console.error(await e.response.text())
  }
}

