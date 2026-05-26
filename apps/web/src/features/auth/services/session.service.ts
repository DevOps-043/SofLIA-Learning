import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service';
import { logger } from '../../../lib/logger';
import { createAuthActionClient } from '../../../lib/supabase/auth-server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { createClient } from '../../../lib/supabase/server';
import {
  buildLegacySessionRecord,
  cacheLegacySessionUser,
  findActiveLegacySessionUser,
  getCachedLegacySessionUser,
  revokeLegacySession,
} from './session-legacy.service';
import type {
  DynamicServerUsageError,
  SessionUserRecord,
} from './session.types';

// Short-TTL cache to deduplicate parallel users-table queries within the same page-load burst.
// Keyed by userId; entries expire after 5 s so profile changes propagate quickly.
interface UserCacheEntry {
  user: SessionUserRecord;
  expiresAt: number;
}
const _userCache = new Map<string, UserCacheEntry>();
const USER_CACHE_TTL_MS = 5_000;

function _getCachedUser(userId: string): SessionUserRecord | null {
  const entry = _userCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _userCache.delete(userId);
    return null;
  }
  return entry.user;
}

function _setCachedUser(userId: string, user: SessionUserRecord): void {
  _userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}

function _invalidateCachedUser(userId: string): void {
  _userCache.delete(userId);
}

function isDynamicServerUsageError(
  error: unknown
): error is DynamicServerUsageError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const dynamicError = error as DynamicServerUsageError;
  return (
    dynamicError.digest === 'DYNAMIC_SERVER_USAGE' ||
    dynamicError.message?.includes('Dynamic server usage') === true
  );
}

export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';

  /**
   * Crea una sesion legacy (user_session) para compatibilidad.
   * NO establece cookies. Las cookies deben establecerse en el Server Action.
   */
  static async createLegacySession(
    userId: string,
    rememberMe: boolean = false
  ): Promise<{ sessionToken: string; expiresAt: Date }> {
    logger.debug('Creando sesion legacy para compatibilidad');

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );

    const supabase = await createClient();
    const legacySession = buildLegacySessionRecord({
      userId,
      sessionToken,
      expiresAt,
      ip,
      userAgent,
    });

    const { error: legacyError } = await supabase
      .from('user_session')
      .insert(legacySession);

    if (legacyError) {
      logger.error('Error creando sesion legacy (no critico)', legacyError);
      throw new Error(`Error creando sesion legacy: ${legacyError.message}`);
    }

    logger.debug('Sesion legacy creada exitosamente');

    return { sessionToken, expiresAt };
  }

  /**
   * Obtiene el usuario actual desde la sesion.
   * Soporta tanto el sistema legacy (user_session) como el nuevo (refresh_tokens).
   */
  static async getCurrentUser(): Promise<SessionUserRecord | null> {
    try {
      logger.debug('SessionService: Obteniendo usuario actual');
      const cookieStore = await cookies();

      let userId: string | null = null;
      let resolvedUser: SessionUserRecord | null = null;
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.id) {
        userId = authUser.id;
        logger.debug('Usando sesion nativa de Supabase Auth', { userId });
      }

      const accessToken = cookieStore.get('access_token')?.value;
      if (!userId && accessToken) {
        logger.debug('Usando sistema de refresh tokens');
        const refreshToken = cookieStore.get('refresh_token')?.value;

        if (refreshToken) {
          const tokenHash = await RefreshTokenService.hashTokenForLookup(
            refreshToken
          );

          const { data: token, error: tokenError } = await supabase
            .from('refresh_tokens')
            .select('id, user_id, token_hash, expires_at')
            .eq('token_hash', tokenHash)
            .eq('is_revoked', false)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (tokenError || !token) {
            logger.debug('Refresh token no encontrado o expirado');
          } else {
            userId = token.user_id;

            void Promise.resolve(
              supabase
                .from('refresh_tokens')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', token.id)
            ).catch(() => undefined);
          }
        } else {
          logger.debug('No hay refresh token en cookie');
        }
      }

      if (!userId) {
        logger.debug('Usando sistema legacy (user_session)');
        const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;

        if (!sessionToken) {
          logger.debug('No hay token de sesion legacy en cookie');
          return null;
        }

        logger.debug('Session token encontrado en cookie, validando...');

        const cachedUser = getCachedLegacySessionUser(sessionToken);
        if (cachedUser) {
          logger.debug('Usuario encontrado en cache (sistema legacy)');
          return cachedUser;
        }

        resolvedUser = await findActiveLegacySessionUser(sessionToken);
        if (!resolvedUser) {
          return null;
        }

        logger.auth('Sesion legacy valida encontrada', {
          userId: resolvedUser.id,
        });

        userId = resolvedUser.id;
      }

      if (!userId) {
        logger.debug('No se pudo determinar userId de ninguna sesion');
        return null;
      }

      if (!resolvedUser) {
        const cached = _getCachedUser(userId);
        if (cached) {
          resolvedUser = cached;
        } else {
          logger.debug('Buscando usuario con ID', { userId });
          const profileClient = createAdminClient();
          const { data: user, error: userError } = await profileClient
            .from('users')
            .select(
              'id, username, email, first_name, last_name, display_name, cargo_rol, profile_picture_url, is_banned, signature_url, signature_name'
            )
            .eq('id', userId)
            .single();

          if (userError) {
            logger.error('Error obteniendo usuario de la DB:', {
              userId,
              error: userError,
            });
            return null;
          }

          if (!user) {
            logger.warn('Usuario no encontrado en la DB', { userId });
            return null;
          }

          resolvedUser = user as SessionUserRecord;
          _setCachedUser(userId, resolvedUser);
        }
      }

      const sessionUser = resolvedUser;

      if (sessionUser.is_banned) {
        _invalidateCachedUser(sessionUser.id);
        logger.auth('Usuario baneado intentando acceder', {
          userId: sessionUser.id,
          username: sessionUser.username,
        });
        await this.destroySession();
        return null;
      }

      logger.auth('Usuario obtenido exitosamente', {
        userId: sessionUser.id,
        username: sessionUser.username,
        email: sessionUser.email,
        cargo_rol: sessionUser.cargo_rol,
      });

      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      if (sessionToken) {
        cacheLegacySessionUser(sessionToken, sessionUser);
      }

      return sessionUser;
    } catch (error) {
      if (isDynamicServerUsageError(error)) {
        throw error;
      }

      logger.error('Error critico obteniendo usuario actual:', {
        name: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Destruye la sesion actual, revocando tanto los refresh tokens como la sesion legacy.
   */
  static async destroySession(): Promise<void> {
    try {
      logger.auth('Destruyendo sesion');
      const cookieStore = await cookies();
      const authClient = await createAuthActionClient();
      const {
        data: { user: authUser },
      } = await authClient.auth.getUser();

      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      const refreshToken = cookieStore.get('refresh_token')?.value;
      let userId: string | null = authUser?.id ?? null;

      if (sessionToken) {
        try {
          const legacyUserId = await revokeLegacySession(sessionToken);
          if (legacyUserId) {
            userId = legacyUserId;
          }
        } catch (dbError) {
          logger.warn('Error al revocar sesion legacy:', { error: dbError });
        }
      }

      if (!userId && refreshToken) {
        try {
          const tokenHash = await RefreshTokenService.hashTokenForLookup(
            refreshToken
          );
          const supabase = await createClient();

          const { data: token } = await supabase
            .from('refresh_tokens')
            .select('user_id')
            .eq('token_hash', tokenHash)
            .single();

          if (token) {
            userId = token.user_id;
          }
        } catch (hashError) {
          logger.warn(
            'Error al obtener userId desde refresh token:',
            { error: hashError }
          );
        }
      }

      if (userId) {
        try {
          await RefreshTokenService.revokeAllUserTokens(userId, 'user_logout');
          logger.auth('Todos los refresh tokens del usuario revocados');
        } catch (revokeError) {
          logger.warn('Error al revocar refresh tokens:', { error: revokeError });
        }
      }

      await authClient.auth.signOut();

      const deleteCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      };

      cookieStore.set(this.SESSION_COOKIE_NAME, '', deleteCookieOptions);
      cookieStore.set('access_token', '', deleteCookieOptions);
      cookieStore.set('refresh_token', '', deleteCookieOptions);

      try {
        cookieStore.delete(this.SESSION_COOKIE_NAME);
        cookieStore.delete('access_token');
        cookieStore.delete('refresh_token');
      } catch {
        // delete() puede fallar en algunos contextos.
      }

      logger.auth('Sesion destruida y cookies eliminadas completamente');
    } catch (error) {
      if (isDynamicServerUsageError(error)) {
        throw error;
      }

      logger.error('Error destroying session:', error);
      throw error;
    }
  }

  static async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: session, error } = await supabase
        .from('user_session')
        .select('id')
        .eq('jwt_id', sessionToken)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!session;
    } catch {
      return false;
    }
  }
}
