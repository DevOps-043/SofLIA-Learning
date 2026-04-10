import { NextRequest, NextResponse } from 'next/server'
import {
  getSecurityStateCookieOptions,
  getVerificationChallengeCookieOptions,
  hashUserAgent,
  mergeSecurityState,
  readSecurityStateFromRequest,
  readVerificationChallengeFromRequest,
  resolvePathnameFromReturnTo,
  SECURITY_STATE_COOKIE_NAME,
  serializeSecurityState,
  VERIFICATION_CHALLENGE_COOKIE_NAME,
} from '@/lib/security/security-state'
import { recordSecurityEvent } from '@/lib/security/security-events'

export const dynamic = 'force-dynamic'

interface VerifyHumanPayload {
  holdDurationMs?: number
  returnTo?: string
}

async function readPayload(request: NextRequest) {
  try {
    return (await request.json()) as VerifyHumanPayload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request)
  const challenge = readVerificationChallengeFromRequest(request)
  const responseHeaders = {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  }

  if (!payload || !challenge) {
    recordSecurityEvent('verification-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined,
      reasons: ['missing verification payload or challenge cookie'],
    })

    return NextResponse.json(
      {
        ok: false,
        error: 'El reto de verificacion ya no es valido. Recarga e intenta nuevamente.',
      },
      { status: 403, headers: responseHeaders },
    )
  }

  const holdDurationMs =
    typeof payload.holdDurationMs === 'number' &&
    Number.isFinite(payload.holdDurationMs)
      ? payload.holdDurationMs
      : 0

  const elapsedSinceIssued = Date.now() - challenge.issuedAt
  const currentUserAgentHash = hashUserAgent(
    request.headers.get('user-agent') || '',
  )

  if (
    holdDurationMs < challenge.minHoldMs ||
    elapsedSinceIssued < challenge.minHoldMs - 120 ||
    currentUserAgentHash !== challenge.userAgentHash
  ) {
    recordSecurityEvent('verification-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined,
      reasons: ['verification challenge requirements not satisfied'],
      metadata: {
        holdDurationMs,
        minHoldMs: challenge.minHoldMs,
        elapsedSinceIssued,
      },
    })

    return NextResponse.json(
      {
        ok: false,
        error: 'No se pudo completar la verificacion. Mantén presionado el botón el tiempo indicado.',
      },
      { status: 403, headers: responseHeaders },
    )
  }

  const currentState = readSecurityStateFromRequest(request)
  const verifiedUntil = Date.now() + 12 * 60 * 60 * 1000
  const nextState = mergeSecurityState(currentState, {
    verifiedHumanUntil: verifiedUntil,
    verifiedPathScope: resolvePathnameFromReturnTo(challenge.returnTo),
  })

  const response = NextResponse.json(
    {
      ok: true,
      redirectTo: challenge.returnTo,
    },
    {
      headers: responseHeaders,
    },
  )

  response.cookies.set(
    SECURITY_STATE_COOKIE_NAME,
    serializeSecurityState(nextState),
    getSecurityStateCookieOptions(),
  )
  response.cookies.set(
    VERIFICATION_CHALLENGE_COOKIE_NAME,
    '',
    {
      ...getVerificationChallengeCookieOptions(),
      maxAge: 0,
    },
  )

  recordSecurityEvent('verification-passed', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
    metadata: {
      verifiedUntil,
      returnTo: challenge.returnTo,
      requestedReturnTo: payload.returnTo,
    },
  })

  return response
}
