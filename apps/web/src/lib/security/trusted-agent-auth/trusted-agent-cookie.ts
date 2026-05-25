import type { NextRequest } from 'next/server'
import { hashUserAgent } from '../security-state'
import { signToken, verifyToken } from '../signed-token'
import {
  isAllowedTrustedAgentId,
  TRUSTED_AGENT_COOKIE_NAME,
  TRUSTED_AGENT_MAX_AGE_MS,
} from './trusted-agent-settings'
import type {
  TrustedAgentCookiePayload,
  TrustedAgentValidation,
} from './trusted-agent.types'

export function createTrustedAgentCookie(params: {
  agentId: string
  userAgent: string
}) {
  return signToken<TrustedAgentCookiePayload>({
    agentId: params.agentId,
    userAgentHash: hashUserAgent(params.userAgent),
    exp: Date.now() + TRUSTED_AGENT_MAX_AGE_MS,
  })
}

export function getTrustedAgentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.ceil(TRUSTED_AGENT_MAX_AGE_MS / 1000),
  }
}

export function validateTrustedAgentCookie(
  request: NextRequest,
): TrustedAgentValidation {
  const token = request.cookies.get(TRUSTED_AGENT_COOKIE_NAME)?.value

  if (!token) {
    return { trusted: false, reasons: [] }
  }

  const payload = verifyToken<TrustedAgentCookiePayload>(token)

  if (!payload) {
    return {
      trusted: false,
      reasons: ['trusted-agent cookie missing or invalid'],
    }
  }

  if (!isAllowedTrustedAgentId(payload.agentId)) {
    return {
      trusted: false,
      agentId: payload.agentId,
      reasons: ['trusted-agent cookie agent id is not allowlisted'],
    }
  }

  const currentUserAgentHash = hashUserAgent(request.headers.get('user-agent') || '')

  if (currentUserAgentHash !== payload.userAgentHash) {
    return {
      trusted: false,
      agentId: payload.agentId,
      reasons: ['trusted-agent cookie user-agent binding mismatch'],
    }
  }

  return {
    trusted: true,
    agentId: payload.agentId,
    reasons: ['valid trusted-agent cookie'],
  }
}
