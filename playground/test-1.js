import {createClient, HTTPError} from "../dist/index.js"

const client = createClient({
  apiKey: '123123',
  // baseUrl: 'http://localhost:8788/api/v1',
})


console.log(
  client.generateImageSignedUrl('tpl_jNvsOYr0cr', {
    modifications: [
      {
        name: 'Description',
        text: 'hello world 123'
      },
    ],
    format: 'svg'
  })
)