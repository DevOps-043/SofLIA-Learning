import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit';
import { isValidCodeVerifier, isValidTicket } from '@/lib/auth/desktop-sso';
import {
  consumeDesktopSsoTicket,
  generateDesktopAccessProof,
  hasActiveMembership,
} from '@/features/auth/services/desktop-sso.service';

/**
 * POST /api/auth/desktop/exchange
 *
 * Canjea el ticket de un solo uso por la prueba de acceso que Pulse Hub
 * convierte en sesion. La identidad sale siempre de la fila del ticket: un
 * correo o identificador enviado en el cuerpo se ignora.
 *
 * CORS abierto y SIN credenciales a proposito. El endpoint no se autentica por
 * cookie sino por la posesion del ticket y del verificador, asi que aceptar
 * cualquier origen no concede nada: un sitio hostil no tiene ninguno de los
 * dos. Admitir credenciales, en cambio, si abriria una via de CSRF.
 */

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

function errorResponse(status: number, code: ExchangeCode) {
  return NextResponse.json({ code }, { headers: RESPONSE_HEADERS, status });
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS, status: 204 });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyAuthRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let ticket: unknown;
  let codeVerifier: unknown;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    ticket = body?.ticket;
    codeVerifier = body?.code_verifier;
  } catch {
    return errorResponse(400, 'invalid_ticket');
  }

  // Un formato invalido se responde igual que un ticket inexistente: no hay
  // motivo para ayudar a distinguir los casos.
  if (!isValidTicket(ticket) || !isValidCodeVerifier(codeVerifier)) {
    return errorResponse(400, 'invalid_ticket');
  }

  try {
    const consumed = await consumeDesktopSsoTicket(ticket, codeVerifier);
    if (!consumed.ok) {
      return errorResponse(400, 'invalid_ticket');
    }

    if (!(await hasActiveMembership(consumed.userId))) {
      return errorResponse(403, 'access_denied');
    }

    const proof = await generateDesktopAccessProof(consumed.userId);
    if (!proof) {
      return errorResponse(503, 'exchange_unavailable');
    }

    return NextResponse.json(
      { tokenHash: proof.tokenHash },
      { headers: RESPONSE_HEADERS, status: 200 }
    );
  } catch (error) {
    logger.error('SSO escritorio: fallo el canje', error);

    return errorResponse(503, 'exchange_unavailable');
  }
}
