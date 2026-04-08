import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { hashUserAgent } from './security-state'
import {
  getSecuritySigningSecret,
  signToken,
  verifyToken,
} from './signed-token'

const TRUSTED_AGENT_MAX_AGE_MS = 5 * 60 * 1000
export const TRUSTED_AGENT_COOKIE_NAME = 'soflia_agent'

export interface TrustedAgentValidation {
  trusted: boolean
  agentId?: string
  reasons: string[]
}

interface TrustedAgentCookiePayload {
  agentId: string
  userAgentHash: string
  exp: number
}

function getAllowedAgentIds() {
  return (
    process.env.SOFLIA_TRUSTED_AGENT_IDS ||
    'desktop-agent,desktop-extension,soflia-extension,soflia-desktop,soflia-web'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function isAllowedTrustedAgentId(agentId: string) {
  return getAllowedAgentIds().includes(agentId)
}

function getTrustedAgentBootstrapKey() {
  return process.env.SOFLIA_TRUSTED_AGENT_BOOTSTRAP_KEY || ''
}

export function validateTrustedAgentBootstrap(request: NextRequest) {
  const bootstrapKey = getTrustedAgentBootstrapKey()
  const providedBootstrap = request.headers
    .get('x-soflia-agent-bootstrap')
    ?.trim()

  if (!bootstrapKey) {
    return process.env.NODE_ENV !== 'production'
  }

  return providedBootstrap === bootstrapKey
}

function buildTrustedAgentSignatureInput(params: {
  agentId: string
  timestamp: string
  method: string
  pathname: string
}) {
  const { agentId, timestamp, method, pathname } = params

  return `${agentId}:${timestamp}:${method.toUpperCase()}:${pathname}`
}

export function createTrustedAgentHeaders(params: {
  agentId: string
  pathname: string
  method: string
  timestamp?: string
}) {
  const timestamp = params.timestamp || String(Date.now())
  const canonicalInput = buildTrustedAgentSignatureInput({
    agentId: params.agentId,
    timestamp,
    method: params.method,
    pathname: params.pathname,
  })
  const signature = createHmac('sha256', getSecuritySigningSecret())
    .update(canonicalInput)
    .digest('base64url')

  return {
    'x-soflia-agent-id': params.agentId,
    'x-soflia-agent-ts': timestamp,
    'x-soflia-agent-signature': signature,
  }
}

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
  const payload = verifyToken<TrustedAgentCookiePayload>(token)

  if (!token) {
    return {
      trusted: false,
      reasons: [],
    }
  }

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

  const currentUserAgentHash = hashUserAgent(
    request.headers.get('user-agent') || '',
  )

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

export function validateTrustedAgentHeaders(
  request: NextRequest,
): TrustedAgentValidation {
  const agentId = request.headers.get('x-soflia-agent-id')?.trim()
  const timestamp = request.headers.get('x-soflia-agent-ts')?.trim()
  const signature = request.headers.get('x-soflia-agent-signature')?.trim()

  if (!agentId && !timestamp && !signature) {
    return {
      trusted: false,
      reasons: [],
    }
  }

  const reasons: string[] = []

  if (!agentId || !timestamp || !signature) {
    reasons.push('missing required signed-agent headers')
    return { trusted: false, reasons }
  }

  if (!getAllowedAgentIds().includes(agentId)) {
    reasons.push('agent id is not allowlisted')
    return { trusted: false, agentId, reasons }
  }

  const timestampValue = Number(timestamp)
  if (!Number.isFinite(timestampValue)) {
    reasons.push('invalid signed-agent timestamp')
    return { trusted: false, agentId, reasons }
  }

  if (Math.abs(Date.now() - timestampValue) > TRUSTED_AGENT_MAX_AGE_MS) {
    reasons.push('signed-agent timestamp expired')
    return { trusted: false, agentId, reasons }
  }

  const canonicalInput = buildTrustedAgentSignatureInput({
    agentId,
    timestamp,
    method: request.method,
    pathname: request.nextUrl.pathname,
  })

  const expectedSignature = createHmac('sha256', getSecuritySigningSecret())
    .update(canonicalInput)
    .digest('base64url')

  if (expectedSignature.length !== signature.length) {
    reasons.push('signed-agent signature length mismatch')
    return { trusted: false, agentId, reasons }
  }

  const validSignature = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  )

  if (!validSignature) {
    reasons.push('signed-agent signature mismatch')
    return { trusted: false, agentId, reasons }
  }

  return {
    trusted: true,
    agentId,
    reasons: ['valid signed first-party agent request'],
  }
}
