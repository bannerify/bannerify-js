import { createClient, HTTPError } from '../dist'

const client = createClient({
  apiKey: '123123',
  baseUrl: 'https://beta.bannerify.co/api/v1',
})

console.log(
  await client.generateImageSignedUrl('tpl_rVbG8o2cWA', {
    /*modifications: [{
      name: 'Text',
      text: 'Hello World 123',
    }]*/
  })
)