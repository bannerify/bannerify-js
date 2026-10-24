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

describe("renderVideo", () => {
  const sse = (events: { type: string }[]) =>
    new Response(
      events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""),
      { headers: { "Content-Type": "text/event-stream" } },
    )

  const clientAnswering = (answer: () => Response, requests: Request[] = []) =>
    new Bannerify(vectors.apiKey, {
      baseUrl: vectors.baseUrl,
      fetch: (async (input: Request | URL | string, init?: RequestInit) => {
        requests.push(input instanceof Request ? input : new Request(input, init))
        return answer()
      }) as typeof fetch,
    })

  const done = { type: "done", url: "https://images.bannerify.co/files/a.mp4" }

  test("streams the events of the render", async () => {
    const requests: Request[] = []
    const bannerify = clientAnswering(
      () =>
        sse([
          { type: "queued", ahead: 1 },
          { type: "progress", frame: 30, totalFrames: 60, progress: 0.5 },
          done,
        ] as { type: string }[]),
      requests,
    )

    const events = []
    for await (const event of await bannerify.renderVideo("tpl_x", {
      modifications: [{ name: "Title", text: "Hi" }],
    })) {
      events.push(event)
    }

    expect(events.map((event) => event.type)).toEqual(["queued", "progress", "done"])
    expect(new URL(requests[0]!.url).pathname).toBe("/v1/templates/renderVideo")
    expect(new URL(requests[0]!.url).searchParams.get("stream")).toBe("true")
    expect(await requests[0]!.json<unknown>()).toEqual({
      modifications: [{ name: "Title", text: "Hi" }],
      templateId: "tpl_x",
      apiKey: vectors.apiKey,
    })
  })

  test("turns a refused request into one error event", async () => {
    const error = {
      code: "PRECONDITION_FAILED",
      message: "Video rendering is not available yet.",
      docs: "",
      requestId: "req_1",
    }
    const bannerify = clientAnswering(() => Response.json({ error }, { status: 412 }))

    const events = []
    for await (const event of await bannerify.renderVideo("tpl_x")) events.push(event)

    expect(events).toEqual([{ type: "error", error } as never])
  })

  /** A stream that sends `events`, then drops like a lost connection. */
  const droppedAfter = (events: { type: string }[]) => {
    const chunks = events.map((event) =>
      new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
    )
    return new Response(
      new ReadableStream({
        pull(controller) {
          const chunk = chunks.shift()
          if (chunk) controller.enqueue(chunk)
          else controller.error(new TypeError("network connection was lost"))
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    )
  }

  test("reads the same video again by its id when the stream drops", async () => {
    const requests: Request[] = []
    const answers = [
      () => droppedAfter([{ type: "created", id: "vid_1" }, { type: "queued", ahead: 0 }]),
      () => sse([{ type: "progress", frame: 60, totalFrames: 60, progress: 1 }, done]),
    ]
    const bannerify = clientAnswering(() => answers.shift()!(), requests)

    const events = []
    for await (const event of await bannerify.renderVideo("tpl_x")) events.push(event)

    expect(events.map((event) => event.type)).toEqual(["created", "queued", "progress", "done"])
    expect(requests.map((request) => `${request.method} ${new URL(request.url).pathname}`)).toEqual(
      ["POST /v1/templates/renderVideo", "GET /v1/videos/vid_1"],
    )
    expect(new URL(requests[1]!.url).searchParams.get("stream")).toBe("true")
  })

  test("does not send the render again when it fails before the video has an id", async () => {
    const requests: Request[] = []
    const error = { code: "INTERNAL_SERVER_ERROR", message: "Refused.", docs: "", requestId: "r" }
    const bannerify = clientAnswering(() => Response.json({ error }, { status: 500 }), requests)

    const events = []
    for await (const event of await bannerify.renderVideo("tpl_x")) events.push(event)

    expect(events).toEqual([{ type: "error", error } as never])
    expect(requests).toHaveLength(1)
  })

  test("createVideo answers the id of the video at once", async () => {
    const requests: Request[] = []
    const bannerify = clientAnswering(
      () => Response.json({ id: "vid_1", status: "queued" }, { status: 202 }),
      requests,
    )

    expect(await bannerify.createVideo("tpl_x")).toEqual({
      result: { id: "vid_1", status: "queued" },
    })
    expect(new URL(requests[0]!.url).searchParams.get("wait")).toBe("false")
  })

  test("getVideo answers the status and the URL of a video", async () => {
    const requests: Request[] = []
    const video = { id: "vid_1", status: "done", url: done.url }
    const bannerify = clientAnswering(() => Response.json(video), requests)

    expect(await bannerify.getVideo("vid_1")).toEqual({ result: video } as never)
    expect(new URL(requests[0]!.url).pathname).toBe("/v1/videos/vid_1")
    expect(new URL(requests[0]!.url).searchParams.get("apiKey")).toBe(vectors.apiKey)
  })

  test("renderAndWaitVideo answers the URL of the video, or the error", async () => {
    const waited = await clientAnswering(() =>
      sse([{ type: "queued", ahead: 0 } as { type: string }, done]),
    ).renderAndWaitVideo("tpl_x")
    expect(waited).toEqual({ result: done.url })

    const error = {
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not download a clip.",
      requestId: "req_2",
    }
    const failed = await clientAnswering(() =>
      sse([{ type: "error", error } as { type: string }]),
    ).renderAndWaitVideo("tpl_x")
    expect(failed).toEqual({ error } as never)
  })
})
