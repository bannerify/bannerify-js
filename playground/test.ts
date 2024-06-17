import { createClient } from "../src"
import * as fs from "fs"

const client = createClient('', {
  baseUrl: 'http://localhost:8788/v1',
})

try {
  const result = await client.createImage('tpl_6UGcrEz3o3', {
    format: 'svg',
    modifications: []
  })
  console.log(result)
  await fs.promises.writeFile('./playground/output/1.png', Buffer.from(result.result))
} catch (e: any) {
  console.log(e)
}