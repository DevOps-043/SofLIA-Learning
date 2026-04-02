import { logger } from '../../../lib/logger';
import { createClient } from '../../../lib/supabase/server';
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service';
import {
  SECURE_COOKIE_OPTIONS,
  getCustomCookieOptions,
} from '../../../lib/auth/cookie-config';
import { SessionService } from './session.service';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface RequestMetadata {
  ip: string;
  userAgent: string;
}

export interface AuthCookieStore {
  set(name: string, value: string, options: Record<string, unknown>): void;
}

export interface ServerAuthSession {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
  legacySessionToken: string;
  legacySessionExpiresAt: Date;
  legacyCookieMaxAge: number;
}

interface CreateServerAuthSessionInput {
  userId: string;
  rememberMe: boolean;
  requestMetadata: RequestMetadata;
}

interface NotifyLoginSuccessInput {
  userId: string;
  requestMetadata: RequestMetadata;
  rememberMe?: boolean;
  isOAuth?: boolean;
  isNewUser?: boolean;
  timeoutMs?: number;
}

export function getRequestMetadata(headersLike: {
  get(name: string): string | null;
}): RequestMetadata {
  return {
    userAgent: headersLike.get('user-agent') || 'unknown',
    ip:
      headersLike.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersLike.get('x-real-ip') ||
      'unknown',
  };
}

export async function createServerAuthSession({
  userId,
  rememberMe,
  requestMetadata,
}: CreateServerAuthSessionInput): Promise<ServerAuthSession> {
  const requestHeaders = new Headers();
  requestHeaders.set('user-agent', requestMetadata.userAgent);
  requestHeaders.set('x-real-ip', requestMetadata.ip);

  const mockRequest = new Request('http://localhost', {
    headers: requestHeaders,
  });

  const refreshSession = await RefreshTokenService.createSession(
    userId,
    rememberMe,
    mockRequest
  );
  const legacySession = await SessionService.createLegacySession(
    userId,
    rememberMe
  );

  return {
    accessToken: refreshSession.accessToken,
    accessExpiresAt: refreshSession.accessExpiresAt,
    refreshToken: refreshSession.refreshToken,
    refreshExpiresAt: refreshSession.refreshExpiresAt,
    legacySessionToken: legacySession.sessionToken,
    legacySessionExpiresAt: legacySession.expiresAt,
    legacyCookieMaxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
  };
}

export function writeServerAuthSessionCookies(
  cookieStore: AuthCookieStore,
  session: ServerAuthSession
): void {
  cookieStore.set('access_token', session.accessToken, {
    ...SECURE_COOKIE_OPTIONS,
    expires: session.accessExpiresAt,
  });

  cookieStore.set('refresh_token', session.refreshToken, {
    ...SECURE_COOKIE_OPTIONS,
    expires: session.refreshExpiresAt,
  });

  cookieStore.set('aprende-y-aplica-session', session.legacySessionToken, {
    ...getCustomCookieOptions(session.legacyCookieMaxAge),
    expires: session.legacySessionExpiresAt,
  });
}

export async function updateLastLoginAt(
  supabase: SupabaseServerClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    logger.warn('No se pudo actualizar last_login_at', {
      userId,
      error,
    });
  }
}

export async function notifyLoginSuccessWithTimeout({
  userId,
  requestMetadata,
  rememberMe,
  isOAuth,
  isNewUser,
  timeoutMs = 2000,
}: NotifyLoginSuccessInput): Promise<void> {
  try {
    const { AutoNotificationsService } = await import(
      '../../notifications/services/auto-notifications.service'
    );

    await Promise.race([
      AutoNotificationsService.notifyLoginSuccess(
        userId,
        requestMetadata.ip,
        requestMetadata.userAgent,
        {
          ...(typeof rememberMe === 'boolean' ? { rememberMe } : {}),
          ...(typeof isOAuth === 'boolean' ? { isOAuth } : {}),
          ...(typeof isNewUser === 'boolean' ? { isNewUser } : {}),
          timestamp: new Date().toISOString(),
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      logger.warn('Timeout en notificacion de login, continuando', { userId });
      return;
    }

    logger.error('Error en notificacion de login', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
