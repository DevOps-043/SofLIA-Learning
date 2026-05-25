import type { NextRequest } from 'next/server'

function simpleHash(value: string): string {
  let hash = 0

  for (let index = 0; index < value.length; index++) {
    const char = value.charCodeAt(index)
    hash = (hash << 5) - hash + char
    hash &= hash
  }

  return Math.abs(hash).toString(36).substring(0, 8)
}

export function getIdentifier(
  request: NextRequest,
  prefix = '',
): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0].trim() || realIp || '127.0.0.1'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = simpleHash(userAgent)
  const userId =
    request.cookies.get('aprende-y-aplica-session')?.value || 'anonymous'

  return `${prefix}:${ip}:${userAgentHash}:${userId.substring(0, 8)}`
}
