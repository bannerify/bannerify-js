import ky from 'ky'
import { version } from '../package.json'
import { Modification } from './interface'

interface Options {
  apiKey: string
  fetch?: typeof fetch
  baseUrl?: string
}

type CreateOptions = {
  modifications?: Modification[]
  container?: Modification
  // @default: png
  format?: 'svg' | 'png'
  // default 10s
  timeout?: number
}

export function createClient(opts: Options) {
  return new Bannerify(opts)
}

export class Bannerify {
  private readonly client: typeof ky

  private readonly baseUrl: string

  constructor(
    private readonly opts: Options
  ) {
    this.baseUrl = opts.baseUrl || 'https://beta.bannerify.co/api/v1'
    this.client = ky.create({
      fetch: opts.fetch || fetch,
      prefixUrl: this.baseUrl,
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'X-SDK-Version': `${version}`,
      },
    })
  }

  async createImage(
    templateId: string,
    options?: CreateOptions,
  ) {
    const res = this.client.get('templates/createImage', {
      searchParams: {
        modifications: JSON.stringify(options?.modifications ?? []),
        container: JSON.stringify(options?.container ?? {}),
        templateId,
        apiKey: this.opts.apiKey,
        format: options?.format as string,
      },
      timeout: options?.timeout,
    })
    if (options?.format === 'svg') {
      return res.text()
    }
    return res.arrayBuffer()
  }

  async createPdf(
    templateId: string,
    options?: CreateOptions,
  ) {
    return this.client.get('templates/createPdf', {
      searchParams: {
        modifications: JSON.stringify(options?.modifications ?? []),
        templateId,
        apiKey: this.opts.apiKey,
      },
      timeout: options?.timeout,
    })
      .arrayBuffer()
  }

  async createPermanentImage() {
    throw new Error('Not yet implemented')
  }

  #hashText = async(text:string) => {
    const myText = new TextEncoder().encode(text);
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
    const hashArray = Array.from(new Uint8Array(myDigest));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  async generateImageSignedUrl(
    templateId: string,
    options?: CreateOptions,
  ) {
    const apiKeyAsMd5 = await this.#hashText(this.opts.apiKey)
    const searchParams = new URLSearchParams()
    searchParams.set('apiKeyMd5', apiKeyAsMd5)
    if (options?.format === 'svg') {
      searchParams.set('format', 'svg')
    }
    if (options?.modifications) {
      searchParams.set('modifications', JSON.stringify(options?.modifications))
    }
    searchParams.set('templateId', templateId)
    searchParams.sort()
    // TODO update to this.opts.apiKey
    searchParams.set('sign', await this.#hashText(searchParams.toString() + searchParams.get('apiKeyMd5')))
    return `${this.baseUrl}/templates/imageSignedUrl?${searchParams.toString()}`
  }
}