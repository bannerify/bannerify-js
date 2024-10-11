import { createClient } from '../src'

const client = createClient(process.env.API_KEY!, {
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
