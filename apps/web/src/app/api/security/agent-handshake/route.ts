import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
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

import { agentHandshakeSchema, type AgentHandshakeBody } from '../_schemas'

export const dynamic = 'force-dynamic'

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
}

function sanitizePathname(pathname?: string) {
  if (!pathname) {
    return null
  }

  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return null
  }

  return pathname
}

async function handlePost(request: NextRequest, payload: AgentHandshakeBody) {
  const user = await SessionService.getCurrentUser()

  if (!user) {
    return apiError('UNAUTHENTICATED', 'Unauthorized', 401, {
      headers: RESPONSE_HEADERS,
    })
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

    return apiError('FORBIDDEN', 'Forbidden', 403, {
      headers: RESPONSE_HEADERS,
    })
  }

  const pathname = sanitizePathname(payload.pathname)
  const agentId = payload.agentId?.trim()
  const method =
    typeof payload.method === 'string' ? payload.method.toUpperCase() : 'GET'

  if (!pathname || !agentId || !ALLOWED_METHODS.has(method)) {
    return apiError('INVALID_REQUEST', 'Invalid request', 400, {
      headers: RESPONSE_HEADERS,
    })
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

    return apiError('FORBIDDEN', 'Forbidden', 403, {
      headers: RESPONSE_HEADERS,
    })
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
      headers: RESPONSE_HEADERS,
    },
  )

  response.cookies.set(
    TRUSTED_AGENT_COOKIE_NAME,
    trustedAgentCookie,
    getTrustedAgentCookieOptions(),
  )

  return response
}

export const POST = withZodBody(agentHandshakeSchema, handlePost, {
  emptyBodyFallback: {},
})
