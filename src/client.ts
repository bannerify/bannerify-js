import ky, { HTTPError, TimeoutError } from "ky"
import { getTelemetry } from "./telemetry"
import type { Modification, S3Config } from "./interface"
import { type ErrorResponse, type Result, timeoutError } from "./types"

const SUPPORTED_FORMATS = ["png", "jpeg", "webp"] as const

type ImageFormat = (typeof SUPPORTED_FORMATS)[number]

type NormalizedFormat =
  | {
      ok: true
      format: ImageFormat
    }
  | {
      ok: false
    }

const isSupportedFormat = (value: string): value is ImageFormat =>
  (SUPPORTED_FORMATS as readonly string[]).includes(value)

const normalizeFormat = (value?: string): NormalizedFormat => {
  if (!value) {
    return { ok: true, format: "png" }
  }
  if (isSupportedFormat(value)) {
    return { ok: true, format: value }
  }
  return { ok: false }
}

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
  // @default: png
  thumbnail?: boolean
  nocache?: boolean
  format?: ImageFormat
}

type CreateStoredImageOptions = CreateOptions & {
  s3Config?: S3Config
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

  async createImage(templateId: string, options?: CreateOptions) {
    try {
      const normalizedFormat = normalizeFormat(options?.format)
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
          thumbnail: options?.thumbnail ?? false,
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

  async createPdf(templateId: string, options?: CreateOptions) {
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

  async createStoredImage(templateId: string, options?: CreateStoredImageOptions) {
    try {
      const normalizedFormat = normalizeFormat(options?.format)
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
          thumbnail: options?.thumbnail ?? false,
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

  #hashText = async (text: string) => {
    const myText = new TextEncoder().encode(text)
    const myDigest = await crypto.subtle.digest({ name: "SHA-256" }, myText)
    const hashArray = Array.from(new Uint8Array(myDigest))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
  }

  async generateImageSignedUrl(templateId: string, options?: CreateOptions) {
    const apiKeyHashed = await this.#hashText(this.apiKey)
    const searchParams = new URLSearchParams()
    searchParams.set("apiKeyHashed", apiKeyHashed)
    if (options?.format) {
      const normalizedFormat = normalizeFormat(options.format)
      if (!normalizedFormat.ok) {
        throw new Error(
          `Unsupported format "${options.format}". Valid formats are png, jpeg, or webp.`,
        )
      }
      searchParams.set("format", normalizedFormat.format)
    }
    if (options?.modifications) {
      searchParams.set("modifications", JSON.stringify(options?.modifications))
    }
    if (options?.nocache) {
      searchParams.set("nocache", "true")
    }
    if (options?.thumbnail) {
      searchParams.set("thumbnail", "true")
    }
    searchParams.set("templateId", templateId)
    searchParams.sort()
    // TODO update to this.opts.apiKey
    searchParams.set(
      "sign",
      await this.#hashText(searchParams.toString() + searchParams.get("apiKeyHashed")),
    )
    return `${this.baseUrl}/templates/signedurl?${searchParams.toString()}`
  }
}
