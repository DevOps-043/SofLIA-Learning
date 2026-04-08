import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import {
  createTrustedAgentCookie,
  createTrustedAgentHeaders,
  getTrustedAgentCookieOptions,
  isAllowedTrustedAgentId,
  TRUSTED_AGENT_COOKIE_NAME,
  validateTrustedAgentBootstrap,
} from '@/lib/security/trusted-agent-auth'
import { recordSecurityEvent } from '@/lib/security/security-events'

export const dynamic = 'force-dynamic'

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

interface AgentHandshakePayload {
  agentId?: string
  pathname?: string
  method?: string
}

async function readPayload(request: NextRequest) {
  try {
    return (await request.json()) as AgentHandshakePayload
  } catch {
    return null
  }
}

function sanitizePathname(pathname?: string) {
  if (!pathname || typeof pathname !== 'string') {
    return null
  }

  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return null
  }

  return pathname
}

export async function POST(request: NextRequest) {
  const responseHeaders = {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  }
  const user = await SessionService.getCurrentUser()

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      {
        status: 401,
        headers: responseHeaders,
      },
    )
  }

  if (!validateTrustedAgentBootstrap(request)) {
    recordSecurityEvent('trusted-agent-auth-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined,
      reasons: ['trusted-agent bootstrap validation failed'],
      metadata: {
        userId: user.id,
        productionMode: process.env.NODE_ENV === 'production',
      },
    })

    return NextResponse.json(
      {
        error: 'Forbidden',
      },
      {
        status: 403,
        headers: responseHeaders,
      },
    )
  }

  const payload = await readPayload(request)
  const pathname = sanitizePathname(payload?.pathname)
  const agentId = payload?.agentId?.trim()
  const method =
    typeof payload?.method === 'string' ? payload.method.toUpperCase() : 'GET'

  if (!pathname || !agentId || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json(
      {
        error: 'Invalid request',
      },
      {
        status: 400,
        headers: responseHeaders,
      },
    )
  }

  if (!isAllowedTrustedAgentId(agentId)) {
    recordSecurityEvent('trusted-agent-auth-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined,
      reasons: ['agent id is not allowlisted for handshake'],
      metadata: {
        requestedAgentId: agentId,
        requestedPathname: pathname,
        requestedMethod: method,
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        error: 'Forbidden',
      },
      {
        status: 403,
        headers: responseHeaders,
      },
    )
  }

  const signedHeaders = createTrustedAgentHeaders({
    agentId,
    pathname,
    method,
  })
  const trustedAgentCookie = createTrustedAgentCookie({
    agentId,
    userAgent: request.headers.get('user-agent') || '',
  })
  const expiresAt = Number(signedHeaders['x-soflia-agent-ts']) + 5 * 60 * 1000

  recordSecurityEvent('trusted-agent-handshake-issued', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
    metadata: {
      userId: user.id,
      agentId,
      targetPathname: pathname,
      targetMethod: method,
      expiresAt,
    },
  })

  const response = NextResponse.json(
    {
      ok: true,
      agentId,
      pathname,
      method,
      expiresAt,
      headers: signedHeaders,
    },
    {
      headers: responseHeaders,
    },
  )

  response.cookies.set(
    TRUSTED_AGENT_COOKIE_NAME,
    trustedAgentCookie,
    getTrustedAgentCookieOptions(),
  )

  return response
}
