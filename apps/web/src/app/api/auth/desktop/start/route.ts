import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

import { logger } from '@/lib/logger';
import { SECURE_COOKIE_OPTIONS } from '@/lib/auth/cookie-config';
import {
  buildDesktopCallbackUrl,
  buildDesktopErrorUrl,
  DESKTOP_SSO_COOKIE_MAX_AGE_SECONDS,
  DESKTOP_SSO_COOKIE_NAME,
  isValidCodeChallenge,
  isValidState,
  serializeDesktopSsoRequest,
} from '@/lib/auth/desktop-sso';
import { buildDesktopHandoffResponse } from '@/lib/auth/desktop-sso-handoff';
import {
  hasActiveMembership,
  issueDesktopSsoTicket,
} from '@/features/auth/services/desktop-sso.service';
import { getRequestMetadata } from '@/features/auth/services/auth-session.service';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/auth/desktop/start
 *
 * Punto de entrada del inicio de sesion federado de Pulse Hub.
 *
 * Si ya hay sesion web abierta se emite el ticket de inmediato: es el mismo
 * dominio de confianza y forzar reautenticacion solo anadiria friccion sin
 * cerrar ninguna via, porque quien controla ese navegador ya tiene acceso
 * completo al producto web.
 *
 * Si no la hay, se recuerda la peticion en una cookie y se manda al login
 * normal; el callback de OAuth la recoge al terminar.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');

  // Sin `state` valido no hay a donde devolver el error: se responde en la web.
  if (!isValidState(state)) {
    return NextResponse.json({ code: 'invalid_request' }, { status: 400 });
  }

  if (!isValidCodeChallenge(codeChallenge)) {
    return buildDesktopHandoffResponse(buildDesktopErrorUrl(state, 'invalid_request'));
  }

  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      const cookieStore = await cookies();
      cookieStore.set(
        DESKTOP_SSO_COOKIE_NAME,
        serializeDesktopSsoRequest({ codeChallenge, state }),
        { ...SECURE_COOKIE_OPTIONS, maxAge: DESKTOP_SSO_COOKIE_MAX_AGE_SECONDS }
      );

      return NextResponse.redirect(new URL('/auth', request.url));
    }

    if (!(await hasActiveMembership(user.id))) {
      return buildDesktopHandoffResponse(buildDesktopErrorUrl(state, 'access_denied'));
    }

    const metadata = getRequestMetadata(await headers());
    const ticket = await issueDesktopSsoTicket({
      codeChallenge,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      userId: user.id,
    });

    return buildDesktopHandoffResponse(buildDesktopCallbackUrl(ticket, state));
  } catch (error) {
    logger.error('SSO escritorio: fallo el arranque del flujo', error);

    return buildDesktopHandoffResponse(
      buildDesktopErrorUrl(state, 'exchange_unavailable')
    );
  }
}
