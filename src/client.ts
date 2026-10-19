import ky, { HTTPError, TimeoutError } from "ky"
import { getTelemetry } from "./telemetry"
import type { Modification, S3Config } from "./interface"
import { validateImageFormat, type ImageFormat } from "./format"
import { type ErrorResponse, type Result, timeoutError } from "./types"

const invalidFormatResult = <T>(value?: string): Result<T> => ({
  error: {
    // @ts-ignore – local validation error
    code: "INVALID_FORMAT",
    docs: "https://bannerify.co/docs",
    message: `Unsupported format "${value ?? "undefined"}". Valid formats are png, jpeg, or webp.`,
    requestId: "local",
  },
})

interface Options {
  fetch?: typeof fetch
  baseUrl?: string
  // default 10s
  timeout?: number
}

type CreateOptions = {
  modifications?: Modification[]
  // template?: Modification
  nocache?: boolean
  // @default: png
  format?: ImageFormat
  // Encoder quality for the lossy formats (jpeg, webp). 1-100, defaults to 90.
  quality?: number
}

type CreateStoredImageOptions = CreateOptions & {
  s3Config?: S3Config
}

type RenderVideoOptions = {
  modifications?: Modification[]
}

/**
 * An event of `renderVideo`. A render waits in line (`queued`, with the renders before it), renders
 * its frames (`progress`, from 0 to 1), and ends with `done` and the URL of the MP4, or `error`.
 */
export type RenderVideoEvent =
  | { type: "queued"; ahead: number }
  | { type: "progress"; frame: number; totalFrames: number; progress: number }
  | { type: "done"; url: string }
  | { type: "error"; error: ErrorResponse["error"] | (typeof timeoutError)["error"] }

/** The JSON of each `data` field of a server-sent event stream. */
async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<RenderVideoEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    buffer += decoder.decode(read.value, { stream: true })
    let end = buffer.indexOf("\n\n")
    while (end !== -1) {
      const data = buffer
        .slice(0, end)
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
      buffer = buffer.slice(end + 2)
      if (data) yield JSON.parse(data) as RenderVideoEvent
      end = buffer.indexOf("\n\n")
    }
  }
}

async function* single(event: RenderVideoEvent): AsyncGenerator<RenderVideoEvent> {
  yield event
}

export function createClient(apiKey: string, opts?: Options) {
  return new Bannerify(apiKey, opts)
}

export class Bannerify {
  private readonly client: typeof ky

  private readonly baseUrl: string

  constructor(
    private readonly apiKey: string,
    private readonly opts?: Options,
  ) {
    const telemetry = getTelemetry()
    this.baseUrl = opts?.baseUrl || "https://api.bannerify.co/v1"
    this.client = ky.create({
      fetch: opts?.fetch || globalThis.fetch.bind(globalThis),
      prefixUrl: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-SDK-Version": `${telemetry?.sdkVersions}`,
        "X-Platform": telemetry?.platform,
        "X-Runtime": telemetry?.runtime,
      },
      timeout: opts?.timeout ?? 60e3,
    })
  }

  async createImage(templateId: string, options?: CreateOptions): Promise<Result<ArrayBuffer>> {
    try {
      const normalizedFormat = validateImageFormat(options?.format)
      if (!normalizedFormat.ok) {
        return invalidFormatResult(options?.format)
      }
      const res = await this.client.post("templates/createImage", {
        json: {
          modifications: options?.modifications ?? [],
          // template: JSON.stringify(options?.template ?? {}),
          templateId,
          apiKey: this.apiKey,
          format: normalizedFormat.format,
        },
      })
      return { result: await res.arrayBuffer() }
    } catch (e: any) {
      if (e instanceof HTTPError) {
        const json = await e.response.json()
        return { error: json.error }
      }
      if (e instanceof TimeoutError) {
        return { error: timeoutError.error }
      }
      throw e
    }
  }

  async createPdf(templateId: string, options?: CreateOptions): Promise<Result<ArrayBuffer>> {
    try {
      const res = await this.client.post("templates/createPdf", {
        json: {
          modifications: options?.modifications ?? [],
          // template: JSON.stringify(options?.template ?? {}),
          templateId,
          apiKey: this.apiKey,
        },
      })
      return { result: await res.arrayBuffer() }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (e: any) {
      if (e instanceof HTTPError) {
        const json = await e.response.json()
        return { error: json.error }
      }
      if (e instanceof TimeoutError) {
        return { error: timeoutError.error }
      }
      throw e
    }
  }

  async createStoredImage(
    templateId: string,
    options?: CreateStoredImageOptions,
  ): Promise<Result<string>> {
    try {
      const normalizedFormat = validateImageFormat(options?.format)
      if (!normalizedFormat.ok) {
        return invalidFormatResult(options?.format)
      }
      const res = await this.client.post("templates/createStoredImage", {
        json: {
          modifications: options?.modifications ?? [],
          // template: JSON.stringify(options?.template ?? {}),
          templateId,
          apiKey: this.apiKey,
          format: normalizedFormat.format,
          s3Config: options?.s3Config,
        },
      })
      const json = (await res.json()) as { url: string }
      return { result: json.url }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (e: any) {
      if (e instanceof HTTPError) {
        const json = await e.response.json()
        return { error: json.error }
      }
      if (e instanceof TimeoutError) {
        return { error: timeoutError.error }
      }
      throw e
    }
  }

  /**
   * Renders a video template, and streams its events:
   *
   *   for await (const event of await bannerify.renderVideo("tpl_xxx")) {
   *     if (event.type === "progress") console.log(Math.round(event.progress * 100))
   *     if (event.type === "done") console.log(event.url)
   *   }
   *
   * The last event is `done` or `error`. Each second of the video counts as one generation.
   */
  async renderVideo(
    templateId: string,
    options?: RenderVideoOptions,
  ): Promise<AsyncGenerator<RenderVideoEvent>> {
    try {
      const res = await this.client.post("templates/renderVideo", {
        searchParams: { stream: "true" },
        json: {
          modifications: options?.modifications ?? [],
          templateId,
          apiKey: this.apiKey,
        },
        headers: { Accept: "text/event-stream" },
      })
      if (!res.body) return single({ type: "error", error: timeoutError.error })
      return readEvents(res.body)
    } catch (e) {
      if (e instanceof HTTPError) {
        const json = await e.response.json()
        return single({ type: "error", error: json.error })
      }
      if (e instanceof TimeoutError) {
        return single({ type: "error", error: timeoutError.error })
      }
      throw e
    }
  }

  /** Renders a video template, and answers the URL of the MP4 once it is stored. */
  async renderAndWaitVideo(
    templateId: string,
    options?: RenderVideoOptions,
  ): Promise<Result<string>> {
    for await (const event of await this.renderVideo(templateId, options)) {
      if (event.type === "done") return { result: event.url }
      if (event.type === "error") return { error: event.error }
    }
    return { error: { ...timeoutError.error, message: "The render ended without a video" } }
  }

  #hashText = async (text: string) => {
    const myText = new TextEncoder().encode(text)
    const myDigest = await crypto.subtle.digest({ name: "SHA-256" }, myText)
    const hashArray = Array.from(new Uint8Array(myDigest))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
  }

  // The signature is an HMAC keyed with the API key itself, so a signed URL can
  // be shared without exposing anything that can sign a different one. The
  // apiKeyHashed in the URL only tells the server which key to verify with.
  #signText = async (text: string) => {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.apiKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text))
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  async generateImageSignedUrl(templateId: string, options?: CreateOptions) {
    const apiKeyHashed = await this.#hashText(this.apiKey)
    const searchParams = new URLSearchParams()
    searchParams.set("apiKeyHashed", apiKeyHashed)
    if (options?.format) {
      const normalizedFormat = validateImageFormat(options.format)
      if (!normalizedFormat.ok) {
        throw new Error(normalizedFormat.error.message)
      }
      searchParams.set("format", normalizedFormat.format)
    }
    if (options?.quality !== undefined) {
      searchParams.set("quality", String(options.quality))
    }
    if (options?.modifications) {
      searchParams.set("modifications", JSON.stringify(options?.modifications))
    }
    if (options?.nocache) {
      searchParams.set("nocache", "true")
    }
    searchParams.set("templateId", templateId)
    searchParams.sort()
    searchParams.set("sign", await this.#signText(searchParams.toString()))
    return `${this.baseUrl}/templates/signedurl?${searchParams.toString()}`
  }
}
