import { createClient } from "../src"

const client = createClient(process.env.API_KEY!, {})

/**
 * How to run:
 * bun run ./playground/benchmark-server.ts
 * oha -c 300 -n 100000 http://localhost:3000/
 */
export default {
  async fetch(request: Request) {
    const url = await client.generateImageSignedUrl("tpl_fHE6mpveOV", {
      // make sure every request is a unique image
      modifications: [{ name: "Text", text: "Random text: " + crypto.randomUUID() }],
    })
    // stream response to client
    return await fetch(url)
  },
}
