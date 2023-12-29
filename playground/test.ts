import { createClient, HTTPError } from "../src"
import * as fs from "fs"

const client = createClient({
  apiKey: '123123',
  baseUrl: 'http://localhost:8788/api/v1',
})

try {
  const result = await client.createImage('tpl_rVbG8o2cWA', {
    modifications: [{
      name: 'Text',
      text: 'Hello World',
    }]
  })
  await fs.promises.writeFile('./playground/output/1.png', Buffer.from(result))
} catch (e: any) {
  console.log(e instanceof HTTPError)
  console.log(e.message)
}