import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getRequestMetadata } from '@/features/auth/services/auth-session.service';
import {
  hasActiveMembership,
  issueDesktopSsoTicket,
} from '@/features/auth/services/desktop-sso.service';
import { SessionService } from '@/features/auth/services/session.service';
import { SECURE_COOKIE_OPTIONS } from '@/lib/auth/cookie-config';
import {
  DESKTOP_SSO_COOKIE_NAME,
  isValidCodeChallenge,
} from '@/lib/auth/desktop-sso';
import {
  buildWebSsoCallbackUrl,
  buildWebSsoErrorUrl,
  isAllowedWebSsoRedirectUri,
  isValidWebSsoState,
  serializeWebSsoRequest,
  WEB_SSO_COOKIE_MAX_AGE_SECONDS,
  WEB_SSO_COOKIE_NAME,
} from '@/lib/auth/web-sso';
import { logger } from '@/lib/logger';

function redirectWithoutLeakingReferrer(targetUrl: string): NextResponse {
  const response = NextResponse.redirect(targetUrl);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

/**
 * GET /api/auth/web/start
 *
 * Inicia el SSO de Project Hub. El callback se acepta solo por coincidencia
 * exacta con la lista blanca del servidor antes de consultar la sesion o
 * emitir un ticket.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');

  // Esta comprobacion debe ser la primera defensa del endpoint: un destino no
  // autorizado nunca puede provocar SSO ni recibir un error por redireccion.
  if (!isAllowedWebSsoRedirectUri(redirectUri)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');

  if (!isValidWebSsoState(state)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!isValidCodeChallenge(codeChallenge)) {
    return redirectWithoutLeakingReferrer(
      buildWebSsoErrorUrl(redirectUri, state, 'invalid_request')
    );
  }

  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      const cookieStore = await cookies();
      // Solo puede existir un cliente federado pendiente por navegador.
      cookieStore.delete(DESKTOP_SSO_COOKIE_NAME);
      cookieStore.set(
        WEB_SSO_COOKIE_NAME,
        serializeWebSsoRequest({ codeChallenge, redirectUri, state }),
        { ...SECURE_COOKIE_OPTIONS, maxAge: WEB_SSO_COOKIE_MAX_AGE_SECONDS }
      );

      return redirectWithoutLeakingReferrer(
        new URL('/auth', request.url).toString()
      );
    }

    if (!(await hasActiveMembership(user.id))) {
      return redirectWithoutLeakingReferrer(
        buildWebSsoErrorUrl(redirectUri, state, 'access_denied')
      );
    }

    const metadata = getRequestMetadata(await headers());
    const ticket = await issueDesktopSsoTicket({
      codeChallenge,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      userId: user.id,
    });

    return redirectWithoutLeakingReferrer(
      buildWebSsoCallbackUrl(redirectUri, ticket, state)
    );
  } catch (error) {
    logger.error('SSO web: fallo el arranque del flujo', error);

    return redirectWithoutLeakingReferrer(
      buildWebSsoErrorUrl(redirectUri, state, 'exchange_unavailable')
    );
  }
}
