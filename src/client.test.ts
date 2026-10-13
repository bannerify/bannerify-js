import { describe, expect, test } from "bun:test"
import { Bannerify } from "./client"
import vectors from "../testdata/signed-url-vectors.json"

const client = new Bannerify(vectors.apiKey, { baseUrl: vectors.baseUrl })

const queryPair = (url: string, key: string) =>
  url
    .split("?")[1]
    ?.split("&")
    .find((pair) => pair.startsWith(`${key}=`))

describe("generateImageSignedUrl", () => {
  for (const { input, encoded } of vectors.encoded) {
    test(`encodes ${JSON.stringify(input)} like URLSearchParams`, async () => {
      const url = await client.generateImageSignedUrl(input)
      expect(queryPair(url, "templateId")).toBe(`templateId=${encoded}`)
    })
  }

  for (const golden of vectors.golden) {
    test(`builds the golden URL: ${golden.name}`, async () => {
      const url = await client.generateImageSignedUrl(golden.templateId, {
        format: golden.format as "png" | "webp",
        modifications: golden.modifications ?? undefined,
      })
      expect(url).toBe(golden.url)
    })
  }

  test("signs no thumbnail option", async () => {
    const url = await client.generateImageSignedUrl("tpl_x", { thumbnail: true } as never)
    expect(url).not.toContain("thumbnail")
  })
})

describe("createImage", () => {
  test("sends no thumbnail field", async () => {
    let body: Record<string, unknown> = {}
    const bannerify = new Bannerify(vectors.apiKey, {
      baseUrl: vectors.baseUrl,
      fetch: (async (input: Request | URL | string, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init)
        body = await request.json()
        return new Response(new Uint8Array([1]))
      }) as typeof fetch,
    })

    const { result, error } = await bannerify.createImage("tpl_x", { thumbnail: true } as never)

    expect(error).toBeUndefined()
    expect(result?.byteLength).toBe(1)
    expect(Object.keys(body).sort()).toEqual(["apiKey", "format", "modifications", "templateId"])
  })
})
