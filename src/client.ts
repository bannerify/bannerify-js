import ky from 'ky'
import crypto from 'node:crypto'
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

  generateImageSignedUrl(
    templateId: string,
    options?: CreateOptions,
  ) {
    const apiKeyAsMd5 = crypto.createHash('md5').update(this.opts.apiKey).digest('hex')
    const searchParams = new URLSearchParams()
    searchParams.set('apiKeyMd5', apiKeyAsMd5)
    if (options?.format === 'svg') {
      searchParams.set('format', 'svg')
    }
    if (options?.modifications) {
      searchParams.set('modifications', JSON.stringify(options?.modifications))
    }
    searchParams.set('templateId', templateId)
    searchParams.set('sign', crypto.createHash('md5').update(searchParams.toString() + apiKeyAsMd5).digest('hex'))
    return `${this.baseUrl}/templates/imageSignedUrl?${searchParams.toString()}`
  }
}