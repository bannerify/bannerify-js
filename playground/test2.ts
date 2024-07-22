import { createClient } from '../src'

const client = createClient(process.env.API_KEY!, {
})

try {
  const result = await client.generateImageSignedUrl('tpl_rQut9pLxKr', {
    // format: 'svg',
    // nocache: true,
    modifications: []
  })
  console.log(result)
} catch (e: any) {
  console.log(e.message)
}