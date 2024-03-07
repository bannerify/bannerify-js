import {createClient, HTTPError} from "bannerify-node"
import * as fs from "fs"

const client = createClient({
  apiKey: '123123',
})

const blogPosts = [
  'Next.js vs. Nuxt.js - What are the differences?',
  'How to use Next.js with TypeScript',
  'How to use Next.js with MongoDB',
  'How to use Next.js with Apollo GraphQL',
  'How to use Next.js with Redux',
  'How to use Next.js with Tailwind CSS',
  'How to use Next.js with Express',
]

try {
  const gen = blogPosts.map(async (post, i) => {
    console.time(`Image ${i}`)
    const result = await client.createImage('tpl_YCQAvJckcj', {
      modifications: [{
        name: 'Text',
        text: post,
      }]
    })
    await fs.promises.writeFile(`./out/${i}.png`, Buffer.from(result))
    console.timeEnd(`Image ${i}`)
  })
  await Promise.all(gen)
} catch (e) {
  console.log(e instanceof HTTPError)
  console.log(e.message)
}