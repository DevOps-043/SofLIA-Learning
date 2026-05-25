import { NextRequest, NextResponse } from 'next/server';

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
} from '@/lib/security/security-state';
import { recordSecurityEvent } from '@/lib/security/security-events';
import { withZodBody } from '@/lib/api/with-validation';

import { verifyHumanSchema, type VerifyHumanInput } from './schema';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
};

function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    undefined
  );
}

async function handleVerifyHuman(request: NextRequest, payload: VerifyHumanInput) {
  const challenge = readVerificationChallengeFromRequest(request);

  if (!challenge) {
    recordSecurityEvent('verification-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIp(request),
      reasons: ['missing challenge cookie'],
    });

    return NextResponse.json(
      {
        ok: false,
        error: 'El reto de verificacion ya no es valido. Recarga e intenta nuevamente.',
      },
      { status: 403, headers: RESPONSE_HEADERS },
    );
  }

  const holdDurationMs = payload.holdDurationMs ?? 0;
  const elapsedSinceIssued = Date.now() - challenge.issuedAt;
  const currentUserAgentHash = hashUserAgent(request.headers.get('user-agent') || '');

  if (
    holdDurationMs < challenge.minHoldMs ||
    elapsedSinceIssued < challenge.minHoldMs - 120 ||
    currentUserAgentHash !== challenge.userAgentHash
  ) {
    recordSecurityEvent('verification-failed', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIp(request),
      reasons: ['verification challenge requirements not satisfied'],
      metadata: { holdDurationMs, minHoldMs: challenge.minHoldMs, elapsedSinceIssued },
    });

    return NextResponse.json(
      {
        ok: false,
        error: 'No se pudo completar la verificacion. Manten presionado el boton el tiempo indicado.',
      },
      { status: 403, headers: RESPONSE_HEADERS },
    );
  }

  const currentState = readSecurityStateFromRequest(request);
  const verifiedUntil = Date.now() + 12 * 60 * 60 * 1000;
  const nextState = mergeSecurityState(currentState, {
    verifiedHumanUntil: verifiedUntil,
    verifiedPathScope: resolvePathnameFromReturnTo(challenge.returnTo),
  });

  const response = NextResponse.json(
    { ok: true, redirectTo: challenge.returnTo },
    { headers: RESPONSE_HEADERS },
  );

  response.cookies.set(
    SECURITY_STATE_COOKIE_NAME,
    serializeSecurityState(nextState),
    getSecurityStateCookieOptions(),
  );
  response.cookies.set(VERIFICATION_CHALLENGE_COOKIE_NAME, '', {
    ...getVerificationChallengeCookieOptions(),
    maxAge: 0,
  });

  recordSecurityEvent('verification-passed', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIp(request),
    metadata: {
      verifiedUntil,
      returnTo: challenge.returnTo,
      requestedReturnTo: payload.returnTo,
    },
  });

  return response;
}

export const POST = withZodBody(verifyHumanSchema, handleVerifyHuman);
