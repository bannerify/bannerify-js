import { version } from '../package.json'

export type Telemetry = {
  sdkVersions: string[];
  platform?: string;
  runtime?: string;
};

export function getTelemetry(): Telemetry | null {
  let platform: string | undefined
  let runtime: string | undefined
  const sdkVersions = [`bannerify-js@${version}`]

  try {
    if (process?.env?.UNKEY_DISABLE_TELEMETRY) {
      return null
    }
    platform = process.env.VERCEL ? 'vercel' : process.env.AWS_REGION ? 'aws' : undefined

    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined') {
      runtime = 'edge-light'
    } else if (typeof caches !== 'undefined') {
      runtime = 'cloudflare'
    } else if (process?.version) {
      runtime = `node@${process.version}`
    } else {
      runtime = 'fetch-compatible'
    }

  } catch (_error) {
  }

  return { platform, runtime, sdkVersions }
}