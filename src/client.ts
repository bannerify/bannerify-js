import ky, { HTTPError, TimeoutError } from 'ky'
import { getTelemetry } from './telemetry'
import { Modification } from './interface'
import { ErrorResponse, Result, timeoutError } from './types'

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
  nocache?: boolean
  format?: 'svg' | 'png'
}

export function createClient(apiKey: string, opts?: Options) {
  return new Bannerify(apiKey, opts)
}

export class Bannerify {
  private readonly client: typeof ky

  private readonly baseUrl: string

  constructor(
    private readonly apiKey: string,
    private readonly opts?: Options
  ) {
    const telemetry = getTelemetry()
    this.baseUrl = opts?.baseUrl || 'https://api.bannerify.co/v1'
    this.client = ky.create({
      fetch: opts?.fetch || globalThis.fetch.bind(globalThis),
      prefixUrl: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-SDK-Version': `${telemetry?.sdkVersions}`,
        'X-Platform': telemetry?.platform,
        'X-Runtime': telemetry?.runtime,
      },
      timeout: opts?.timeout ?? 10e3,
    })
  }

  async createImage(
    templateId: string,
    options?: CreateOptions,
  ): Promise<Result<ArrayBuffer | string>> {
    try {
      const res = await this.client.post('templates/createImage', {
        json: {
          modifications: options?.modifications ?? [],
          // template: JSON.stringify(options?.template ?? {}),
          templateId,
          apiKey: this.apiKey,
          format: options?.format as string,
        },
      })
      if (options?.format === 'svg') {
        return { result: await res.text() }
      }
      return { result: await res.arrayBuffer() }
    } catch (e: any) {
      if (e instanceof HTTPError) {
        return (await e.response.json())['error'] as ErrorResponse
      }
      if (e instanceof TimeoutError) {
        return timeoutError as ErrorResponse
      }
      throw e
    }
  }

  async createPdf(
    templateId: string,
    options?: CreateOptions,
  ) {
    throw new Error('Not yet implemented')
  }

  async createPermanentImage() {
    throw new Error('Not yet implemented')
  }

  #hashText = async (text: string) => {
    const myText = new TextEncoder().encode(text)
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText)
    const hashArray = Array.from(new Uint8Array(myDigest))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  async generateImageSignedUrl(
    templateId: string,
    options?: CreateOptions,
  ) {
    const apiKeyHashed = await this.#hashText(this.apiKey)
    const searchParams = new URLSearchParams()
    searchParams.set('apiKeyHashed', apiKeyHashed)
    if (options?.format === 'svg') {
      searchParams.set('format', 'svg')
    }
    if (options?.modifications) {
      searchParams.set('modifications', JSON.stringify(options?.modifications))
    }
    if (options?.nocache) {
      searchParams.set('nocache', 'true')
    }
    searchParams.set('templateId', templateId)
    searchParams.sort()
    // TODO update to this.opts.apiKey
    searchParams.set('sign', await this.#hashText(searchParams.toString() + searchParams.get('apiKeyHashed')))
    return `${this.baseUrl}/templates/signedurl?${searchParams.toString()}`
  }
}