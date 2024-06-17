import { createClient } from '../src'

const client = createClient('', {
  // baseUrl: 'http://localhost:5173/api/v1',
})

try {
  const result = await client.generateImageSignedUrl('tpl_6UGcrEz3o3', {
    // format: 'svg',
    nocache: true,
    modifications: []
  })
  console.log(result)
} catch (e: any) {
  console.log(e.message)
}