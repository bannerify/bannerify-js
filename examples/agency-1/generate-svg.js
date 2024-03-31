import {createClient} from "bannerify-node"
import {faker} from '@faker-js/faker'

const client = createClient({
  apiKey: '',
  baseUrl: 'http://localhost:8788/api/v1',
})

const result = await client.createImage('tpl_c7GYzx389W', {
  modifications: [{
    name: 'Image 1',
    src: 'https://cdn.jsdelivr.net/gh/remojansen/logo.ts@master/ts.svg',
  }, {
    name: 'Text',
    text: 'google.com',
  }, {
    name: 'Text 1',
    text: faker.lorem.sentences(4),
  }],
  format: 'svg'
})
console.log(result)