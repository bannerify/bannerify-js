import { createClient, HTTPError } from "../dist/index.js"

const client = createClient({
  apiKey: '123123',
  baseUrl: 'http://localhost:8788/api/v1',
})


console.log(
  client.generateImageSignedUrl('tpl_E99d1wLEL1', {
    modifications: []
  })
)