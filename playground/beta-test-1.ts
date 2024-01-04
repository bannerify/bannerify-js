import { createClient, HTTPError } from "../src"
import * as fs from "fs"

const client = createClient({
  apiKey: '123123',
  baseUrl: 'https://beta.bannerify.co/api/v1',
})

console.log(
  client.generateImageSignedUrl('tpl_rVbG8o2cWA', {
    modifications: [{
      name: 'Text',
      text: 'Hello World',
    }]
  })
)