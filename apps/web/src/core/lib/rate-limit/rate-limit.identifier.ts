import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

function pseudonymousIdentifier(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 32)
}

export function getIdentifier(
  request: NextRequest,
  prefix = '',
): string {
  const netlifyIp = request.headers.get('x-nf-client-connection-ip')
  const cloudflareIp = request.headers.get('cf-connecting-ip')
  const realIp = request.headers.get('x-real-ip')
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = netlifyIp || cloudflareIp || realIp || forwarded?.split(',')[0].trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const sessionToken =
    request.cookies.get('aprende-y-aplica-session')?.value || 'anonymous'

  // Redis keys must not contain raw IP addresses or bearer-session fragments.
  return `${prefix}:${pseudonymousIdentifier(`${ip}:${userAgent}:${sessionToken}`)}`
}
