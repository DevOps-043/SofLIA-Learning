import { NextRequest, NextResponse } from 'next/server';

import {
  consumeDesktopSsoTicket,
  generateDesktopAccessProof,
  hasActiveMembership,
} from '@/features/auth/services/desktop-sso.service';
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit';
import { isValidCodeVerifier, isValidTicket } from '@/lib/auth/desktop-sso';
import { logger } from '@/lib/logger';

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const RESPONSE_HEADERS = {
  ...CORS_HEADERS,
  'Cache-Control': 'no-store',
};

type ExchangeCode = 'invalid_ticket' | 'access_denied' | 'exchange_unavailable';
type ErrorProperty = 'code' | 'error';

function errorResponse(
  status: number,
  code: ExchangeCode,
  errorProperty: ErrorProperty,
  extraHeaders?: Headers
) {
  const headers = new Headers(RESPONSE_HEADERS);
  extraHeaders?.forEach((value, key) => headers.set(key, value));
  headers.set('Cache-Control', 'no-store');

  return NextResponse.json({ [errorProperty]: code }, { headers, status });
}

export function ssoExchangeOptionsResponse() {
  return new NextResponse(null, { headers: CORS_HEADERS, status: 204 });
}

/** Logica comun de canje para los clientes de escritorio y web. */
export async function handleSsoExchange(
  request: NextRequest,
  errorProperty: ErrorProperty
) {
  const rateLimitResponse = applyAuthRateLimit(request);
  if (rateLimitResponse) {
    return errorResponse(
      429,
      'exchange_unavailable',
      errorProperty,
      rateLimitResponse.headers
    );
  }

  let ticket: unknown;
  let codeVerifier: unknown;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    ticket = body?.ticket;
    codeVerifier = body?.code_verifier;
  } catch {
    return errorResponse(400, 'invalid_ticket', errorProperty);
  }

  if (!isValidTicket(ticket) || !isValidCodeVerifier(codeVerifier)) {
    return errorResponse(400, 'invalid_ticket', errorProperty);
  }

  try {
    const consumed = await consumeDesktopSsoTicket(ticket, codeVerifier);
    if (!consumed.ok) {
      return errorResponse(400, 'invalid_ticket', errorProperty);
    }

    if (!(await hasActiveMembership(consumed.userId))) {
      return errorResponse(403, 'access_denied', errorProperty);
    }

    const proof = await generateDesktopAccessProof(consumed.userId);
    if (!proof) {
      return errorResponse(503, 'exchange_unavailable', errorProperty);
    }

    return NextResponse.json(
      { tokenHash: proof.tokenHash },
      { headers: RESPONSE_HEADERS, status: 200 }
    );
  } catch (error) {
    logger.error('SSO: fallo el canje', error);
    return errorResponse(503, 'exchange_unavailable', errorProperty);
  }
}
