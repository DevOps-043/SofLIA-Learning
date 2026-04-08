import { NextRequest, NextResponse } from 'next/server'
import { recordSecurityEvent } from '@/lib/security/security-events'
import {
  getSecurityStateCookieOptions,
  mergeSecurityState,
  readSecurityStateFromRequest,
  SECURITY_STATE_COOKIE_NAME,
  serializeSecurityState,
} from '@/lib/security/security-state'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source') || 'unknown'
  const currentState = readSecurityStateFromRequest(request)
  const nextState = mergeSecurityState(currentState, {
    honeypotHitAt: Date.now(),
    automationSignalScore: Math.max(
      currentState?.automationSignalScore || 0,
      80,
    ),
  })

  recordSecurityEvent('agent-honeypot-hit', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
    metadata: {
      source,
      referer: request.headers.get('referer') || undefined,
    },
  })

  const response = NextResponse.json(
    {
      error: 'Forbidden',
    },
    {
      status: 403,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    },
  )

  response.cookies.set(
    SECURITY_STATE_COOKIE_NAME,
    serializeSecurityState(nextState),
    getSecurityStateCookieOptions(),
  )

  return response
}
