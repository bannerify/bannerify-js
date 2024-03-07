import { createClient, HTTPError } from "../src"

const client = createClient({
  apiKey: '123123',
  baseUrl: 'http://localhost:8788/api/v1',
})


console.log(
  client.generateImageSignedUrl('tpl_rVbG8o2cWA', {
    modifications: [{
      name: 'Text',
      text: 'Hello World',
    }]
  })
)