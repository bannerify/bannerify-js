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
  // default 10s
  timeout?: number
}

export function createClient(opts: Options) {
  return new Bannerify(opts)
}

export class Bannerify {
  private readonly client: typeof ky

  constructor(
    private readonly opts: Options
  ) {
    this.client = ky.create({
      fetch: opts.fetch ?? fetch,
      prefixUrl: opts.baseUrl ?? 'https://beta.bannerify.co/api/v1',
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
    return this.client.get('image/create', {
      searchParams: {
        modifications: JSON.stringify(options?.modifications ?? []),
        templateId,
        apiKey: this.opts.apiKey,
      },
      timeout: options?.timeout,
    })
      .arrayBuffer()
  }

  async createPdf(
    templateId: string,
    options?: CreateOptions,
  ) {
    return this.client.get('image/create-pdf', {
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
    searchParams.set('modifications', JSON.stringify(options?.modifications ?? []))
    searchParams.set('templateId', templateId)
    searchParams.set('sign', crypto.createHash('md5').update(searchParams.toString() + apiKeyAsMd5).digest('hex'))
    return `${this.opts.baseUrl}/image/signed-url?${searchParams.toString()}`
  }
}