import {createClient} from "bannerify-node"
import {faker} from '@faker-js/faker'
import * as fs from "node:fs";

const client = createClient({
  apiKey: '',
  baseUrl: 'http://localhost:8788/api/v1',
})

try {
  const result = await client.createImage('tpl_E99d1wLEL1', {
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
  await fs.promises.writeFile('playground/output/svg.svg', result)
} catch (e) {
  console.error(e)
  console.error(await e.response.text())
}
