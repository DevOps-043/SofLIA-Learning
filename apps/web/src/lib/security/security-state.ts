import { createHash, randomInt, randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { signToken, verifyToken } from './signed-token'

export const SECURITY_STATE_COOKIE_NAME = 'soflia_sec'
export const VERIFICATION_CHALLENGE_COOKIE_NAME = 'soflia_challenge'

const SECURITY_STATE_MAX_AGE_MS = 12 * 60 * 60 * 1000
const VERIFICATION_CHALLENGE_MAX_AGE_MS = 10 * 60 * 1000

export interface SecurityStateCookie {
  automationSignalScore?: number
  automationDetectedAt?: number
  honeypotHitAt?: number
  verifiedHumanUntil?: number
  verifiedPathScope?: string
  updatedAt: number
  exp: number
}

export interface VerificationChallengeCookie {
  challengeId: string
  issuedAt: number
  minHoldMs: number
  returnTo: string
  userAgentHash: string
  exp: number
}

function toMaxAgeSeconds(maxAgeMs: number) {
  return Math.max(1, Math.ceil(maxAgeMs / 1000))
}

export function hashUserAgent(userAgent: string) {
  return createHash('sha256').update(userAgent).digest('hex').slice(0, 24)
}

export function sanitizeReturnTo(returnTo?: string | null) {
  if (!returnTo || typeof returnTo !== 'string') {
    return '/'
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/'
  }

  return returnTo
}

export function resolvePathnameFromReturnTo(returnTo?: string | null) {
  const sanitizedReturnTo = sanitizeReturnTo(returnTo)
  return sanitizedReturnTo.split('?')[0] || '/'
}

export function readSecurityStateFromRequest(request: Pick<NextRequest, 'cookies'>) {
  return (
    verifyToken<SecurityStateCookie>(
      request.cookies.get(SECURITY_STATE_COOKIE_NAME)?.value,
    ) || null
  )
}

export function mergeSecurityState(
  existingState: SecurityStateCookie | null,
  updates: Partial<Omit<SecurityStateCookie, 'updatedAt' | 'exp'>>,
  maxAgeMs = SECURITY_STATE_MAX_AGE_MS,
) {
  const now = Date.now()

  return {
    ...existingState,
    ...updates,
    updatedAt: now,
    exp: now + maxAgeMs,
  } satisfies SecurityStateCookie
}

export function serializeSecurityState(state: SecurityStateCookie) {
  return signToken(state)
}

export function getSecurityStateCookieOptions(maxAgeMs = SECURITY_STATE_MAX_AGE_MS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: toMaxAgeSeconds(maxAgeMs),
  }
}

export function readVerificationChallengeFromRequest(
  request: Pick<NextRequest, 'cookies'>,
) {
  return (
    verifyToken<VerificationChallengeCookie>(
      request.cookies.get(VERIFICATION_CHALLENGE_COOKIE_NAME)?.value,
    ) || null
  )
}

export function createVerificationChallenge(params: {
  returnTo?: string | null
  userAgent: string
}) {
  const issuedAt = Date.now()

  return {
    challengeId: randomUUID(),
    issuedAt,
    minHoldMs: randomInt(1400, 2301),
    returnTo: sanitizeReturnTo(params.returnTo),
    userAgentHash: hashUserAgent(params.userAgent),
    exp: issuedAt + VERIFICATION_CHALLENGE_MAX_AGE_MS,
  } satisfies VerificationChallengeCookie
}

export function serializeVerificationChallenge(
  challenge: VerificationChallengeCookie,
) {
  return signToken(challenge)
}

export function getVerificationChallengeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: toMaxAgeSeconds(VERIFICATION_CHALLENGE_MAX_AGE_MS),
  }
}

export function isHumanVerificationActive(state: SecurityStateCookie | null) {
  return Boolean(
    state?.verifiedHumanUntil &&
      Number.isFinite(state.verifiedHumanUntil) &&
      state.verifiedHumanUntil > Date.now(),
  )
}

export function isHumanVerificationActiveForPath(
  state: SecurityStateCookie | null,
  pathname: string,
) {
  if (!isHumanVerificationActive(state)) {
    return false
  }

  const verifiedScope = state?.verifiedPathScope
    ? resolvePathnameFromReturnTo(state.verifiedPathScope)
    : null

  if (!verifiedScope) {
    return false
  }

  return (
    pathname === verifiedScope ||
    pathname.startsWith(`${verifiedScope}/`)
  )
}
