import { lookup } from 'dns/promises'
import net from 'net'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

export interface SafeFetchOptions {
  allowedHosts?: readonly string[]
  provider?: string
  resolveHostname?: (hostname: string) => Promise<readonly string[]>
  requireHostAllowlist?: boolean
}

const DEFAULT_ALLOWED_HOSTS = [
  'www.googleapis.com',
  'googleapis.com',
  'img.youtube.com',
] as const

export class UnsafeFetchUrlError extends Error {
  constructor(message: string, readonly url?: string) {
    super(message)
    this.name = 'UnsafeFetchUrlError'
  }
}

export async function safeFetch(
  input: string | URL,
  init: RequestInit = {},
  options: SafeFetchOptions = {},
): Promise<Response> {
  const url = await validateSafeFetchUrl(input, options)
  return fetchWithCircuitBreaker(options.provider ?? url.hostname, url, init)
}

export async function validateSafeFetchUrl(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<URL> {
  const url = parseUrl(input)

  if (url.protocol !== 'https:') {
    throwAndAudit('safe-fetch-blocked', 'Only https URLs are allowed', url)
  }

  const allowedHosts = normalizeAllowedHosts([
    ...DEFAULT_ALLOWED_HOSTS,
    ...getEnvAllowedHosts(),
    ...(options.allowedHosts ?? []),
  ])

  if (
    (options.requireHostAllowlist ?? allowedHosts.length > 0) &&
    !isHostAllowed(url.hostname, allowedHosts)
  ) {
    throwAndAudit('safe-fetch-blocked', 'URL host is not in the allowlist', url)
  }

  const addresses = await resolveAddresses(url.hostname, options.resolveHostname)
  const blockedAddress = addresses.find(isPrivateOrReservedAddress)
  if (blockedAddress) {
    throwAndAudit(
      'safe-fetch-blocked',
      `Resolved address ${blockedAddress} is private or reserved`,
      url,
    )
  }

  return url
}

export function getSafeFetchSupabaseHosts(): string[] {
  return [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL]
    .map((value) => {
      if (!value) return null
      try {
        return new URL(value).hostname
      } catch {
        return null
      }
    })
    .filter((host): host is string => Boolean(host))
}

function parseUrl(input: string | URL): URL {
  try {
    return input instanceof URL ? input : new URL(input)
  } catch {
    throw new UnsafeFetchUrlError('Invalid URL')
  }
}

async function resolveAddresses(
  hostname: string,
  resolveHostname?: (hostname: string) => Promise<readonly string[]>,
) {
  if (net.isIP(hostname)) {
    return [hostname]
  }

  if (resolveHostname) {
    return [...await resolveHostname(hostname)]
  }

  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map((record) => record.address)
}

function getEnvAllowedHosts() {
  return (process.env.SAFE_FETCH_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}

function normalizeAllowedHosts(hosts: readonly string[]) {
  return Array.from(new Set(hosts.map((host) => host.toLowerCase())))
}

function isHostAllowed(hostname: string, allowedHosts: readonly string[]) {
  const normalized = hostname.toLowerCase()
  return allowedHosts.some((allowedHost) => {
    return normalized === allowedHost || normalized.endsWith(`.${allowedHost}`)
  })
}

function isPrivateOrReservedAddress(address: string) {
  if (address.startsWith('::ffff:')) {
    return isPrivateOrReservedAddress(address.slice(7))
  }

  if (net.isIP(address) === 4) {
    return isPrivateOrReservedIpv4(address)
  }

  return isPrivateOrReservedIpv6(address)
}

function isPrivateOrReservedIpv4(address: string) {
  const [first = 0, second = 0] = address.split('.').map(Number)
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first >= 224
  )
}

function isPrivateOrReservedIpv6(address: string) {
  const normalized = address.toLowerCase()
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  )
}

function throwAndAudit(type: 'safe-fetch-blocked', message: string, url: URL): never {
  auditSafeFetchBlock(type, message, url)
  throw new UnsafeFetchUrlError(message, url.toString())
}

function auditSafeFetchBlock(type: 'safe-fetch-blocked', message: string, url: URL) {
  void import('./security-events')
    .then(({ recordSecurityEvent }) => {
      recordSecurityEvent(type, {
        resourceType: 'external_url',
        resourceId: url.hostname,
        metadata: {
          reason: message,
          protocol: url.protocol,
        },
      })
    })
    .catch(() => undefined)
}
