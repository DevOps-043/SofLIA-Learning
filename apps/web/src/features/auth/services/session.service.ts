import { cookies, headers } from 'next/headers';
import { createClient } from '../../../lib/supabase/server';
import { logger } from '../../../lib/logger';
import { cacheGet, cacheSet } from '../../../lib/cache/ttlCache'
import crypto from 'crypto';
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service';
import { getCustomCookieOptions } from '../../../lib/auth/cookie-config';

export class SessionService {
  private static readonly SESSION_COOKIE_NAME = 'aprende-y-aplica-session';
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  /**
   * Crea una sesión legacy (user_session) para compatibilidad
   * NO establece cookies - las cookies deben establecerse en el Server Action
   * @param userId ID del usuario
   * @param rememberMe Si true, la sesión dura 30 días; si false, 7 días
   * @returns Información de la sesión legacy creada (token y fecha de expiración)
   */
  static async createLegacySession(
    userId: string,
    rememberMe: boolean = false
  ): Promise<{ sessionToken: string; expiresAt: Date }> {
    logger.debug('Creando sesión legacy para compatibilidad');

    // Obtener headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);

    const supabase = await createClient();

    const legacySession: any = {
      user_id: userId,
      jwt_id: sessionToken,
      issued_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      ip: ip,
      user_agent: userAgent,
      revoked: false,
    };

    const { error: legacyError } = await supabase.from('user_session').insert(legacySession);

    if (legacyError) {
      logger.error('Error creando sesión legacy (no crítico)', legacyError);
      throw new Error(`Error creando sesión legacy: ${legacyError.message}`);
    }

    logger.debug('✅ Sesión legacy creada exitosamente');

    return { sessionToken, expiresAt };
  }

  /**
   * Obtiene el usuario actual desde la sesión
   * Soporta tanto el sistema legacy (user_session) como el nuevo (refresh_tokens)
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      logger.debug('SessionService: Obteniendo usuario actual');
      const cookieStore = await cookies();

      // Intentar obtener userId desde el sistema de refresh tokens primero
      const accessToken = cookieStore.get('access_token')?.value;
      let userId: string | null = null;

      if (accessToken) {
        // Sistema nuevo: buscar en refresh_tokens
        logger.debug('Usando sistema de refresh tokens');
        const supabase = await createClient();

        // Buscar refresh token activo para este usuario
        // (no podemos decodificar el access token sin JWT, así que usamos el refresh token)
        const refreshToken = cookieStore.get('refresh_token')?.value;

        if (refreshToken) {
          // ⚡ OPTIMIZACIÓN CRÍTICA: Hash y query directo en lugar de fetch ALL + loop
          // ANTES: Fetch ALL tokens → loop con crypto verification (3-5 segundos)
          // DESPUÉS: Hash directo del token → query indexed (10-50ms)

          // Generar hash del refresh token para búsqueda directa
          const tokenHash = await RefreshTokenService.hashTokenForLookup(refreshToken);

          // Query directo por hash (usa índice de BD)
          const { data: token, error: tokenError } = await supabase
            .from('refresh_tokens')
            .select('id, user_id, token_hash, expires_at')
            .eq('token_hash', tokenHash)
            .eq('is_revoked', false)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (tokenError || !token) {
            // Token no encontrado o inválido
            logger.debug('Refresh token no encontrado o expirado');
          } else {
            // Token válido encontrado
            userId = token.user_id;

            // Actualizar last_used_at en background (no bloquear)
            supabase
              .from('refresh_tokens')
              .update({ last_used_at: new Date().toISOString() })
              .eq('id', token.id)
              .then(() => { })
              .catch(() => { }); // Fire and forget
          }
        } else {
          logger.debug('No hay refresh token en cookie');
        }
      }

      // Fallback al sistema legacy si no se encontró con refresh tokens
      if (!userId) {
        logger.debug('Usando sistema legacy (user_session)');
        const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;

        if (!sessionToken) {
          logger.debug('No hay token de sesión legacy en cookie');
          return null;
        }

        logger.debug('Session token encontrado en cookie, validando...');

        // Cache de 30s por token para evitar golpear DB en cada request
        const cached = cacheGet<any>(`user-by-session:${sessionToken}`)
        if (cached) {
          logger.debug('Usuario encontrado en cache (sistema legacy)');
          return cached
        }

        const supabase = await createClient();

        // Buscar sesión válida - validar que el token en la cookie corresponda al jwt_id en la DB
        logger.debug('Buscando sesión legacy en DB con jwt_id', {
          tokenPrefix: sessionToken.substring(0, 8) + '...'
        });
        const { data: session, error: sessionError } = await supabase
          .from('user_session')
          .select('user_id, expires_at, revoked')
          .eq('jwt_id', sessionToken) // ✅ Validación correcta: token de cookie = jwt_id en DB
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (sessionError) {
          logger.warn('⚠️ Error buscando sesión legacy:', {
            code: sessionError.code,
            message: sessionError.message,
            hint: sessionError.hint
          });
          return null;
        }

        if (!session) {
          logger.warn('⚠️ Sesión legacy no encontrada o inválida');
          return null;
        }

        logger.auth('✅ Sesión legacy válida encontrada', {
          userId: session.user_id,
          expiresAt: session.expires_at
        });

        userId = (session as any).user_id;
      }

      // Obtener datos del usuario
      if (!userId) {
        logger.debug('No se pudo determinar userId de ninguna sesión');
        return null;
      }

      logger.debug('Buscando usuario con ID', { userId });
      const supabase = await createClient();
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, first_name, last_name, display_name, cargo_rol, profile_picture_url, is_banned, signature_url, signature_name')
        .eq('id', userId)
        .single();

      if (userError) {
        logger.error('Error obteniendo usuario de la DB:', {
          userId,
          error: userError
        });
        return null;
      }

      if (!user) {
        logger.warn('⚠️ Usuario no encontrado en la DB', { userId });
        return null;
      }

      // ⭐ MODERACIÓN: Verificar si el usuario está baneado
      if ((user as any).is_banned) {
        logger.auth('🚫 Usuario baneado intentando acceder', {
          userId: user.id,
          username: user.username
        });
        // Destruir la sesión automáticamente
        await this.destroySession();
        return null;
      }

      logger.auth('✅ Usuario obtenido exitosamente', {
        userId: user.id,
        username: user.username,
        email: user.email,
        cargo_rol: user.cargo_rol
      });

      // Cachear por token de sesión para evitar consultas repetidas
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      if (sessionToken) {
        cacheSet(`user-by-session:${sessionToken}`, user, 30_000);
      }

      return user;
    } catch (error) {
      // Re-lanzar errores de Next.js para bailout dinámico durante el build
      if (
        (error as any)?.digest === 'DYNAMIC_SERVER_USAGE' || 
        (error as any)?.message?.includes('Dynamic server usage')
      ) {
        throw error;
      }

      logger.error('💥 Error crítico obteniendo usuario actual:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      return null;
    }
  }

  /**
   * Destruye la sesión actual, revocando tanto los refresh tokens como la sesión legacy
   */
  static async destroySession(): Promise<void> {
    try {
      logger.auth('🚪 Destruyendo sesión');
      const cookieStore = await cookies();

      // Obtener el user_id de la sesión actual para revocar todos sus refresh tokens
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;
      const refreshToken = cookieStore.get('refresh_token')?.value;
      let userId: string | null = null;

      // Intentar obtener userId desde sesión legacy
      if (sessionToken) {
        try {
          const supabase = await createClient();

          // Obtener user_id de la sesión legacy
          const { data: session } = await supabase
            .from('user_session')
            .select('user_id')
            .eq('jwt_id', sessionToken)
            .single();

          if (session) {
            userId = (session as any).user_id;
          }

          // Marcar sesión legacy como revocada
          await (supabase
            .from('user_session') as any)
            .update({ revoked: true })
            .eq('jwt_id', sessionToken);

          logger.debug('Sesión legacy revocada');
        } catch (dbError) {
          logger.warn('Error al revocar sesión legacy:', dbError);
        }
      }

      // Si no tenemos userId, intentar obtenerlo desde refresh token
      if (!userId && refreshToken) {
        try {
          const tokenHash = await RefreshTokenService.hashTokenForLookup(refreshToken);
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
          logger.warn('Error al obtener userId desde refresh token:', hashError);
        }
      }

      // Revocar todos los refresh tokens del usuario
      if (userId) {
        try {
          await RefreshTokenService.revokeAllUserTokens(userId, 'user_logout');
          logger.auth('✅ Todos los refresh tokens del usuario revocados');
        } catch (revokeError) {
          logger.warn('Error al revocar refresh tokens:', revokeError);
        }
      }

      // Configuración común para eliminar cookies
      const deleteCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      };

      // Eliminar cookie de sesión legacy
      cookieStore.set(this.SESSION_COOKIE_NAME, '', deleteCookieOptions);
      
      // Eliminar access_token con las mismas opciones de seguridad
      cookieStore.set('access_token', '', deleteCookieOptions);
      
      // Eliminar refresh_token con las mismas opciones de seguridad
      cookieStore.set('refresh_token', '', deleteCookieOptions);

      // También intentar delete() como respaldo
      try {
        cookieStore.delete(this.SESSION_COOKIE_NAME);
        cookieStore.delete('access_token');
        cookieStore.delete('refresh_token');
      } catch (deleteError) {
        // delete() puede fallar en algunos contextos, ignorar
      }

      logger.auth('✅ Sesión destruida y cookies eliminadas completamente');
    } catch (error) {
      // Re-lanzar errores de Next.js para bailout dinámico durante el build
      if (
        (error as any)?.digest === 'DYNAMIC_SERVER_USAGE' || 
        (error as any)?.message?.includes('Dynamic server usage')
      ) {
        throw error;
      }

      logger.error('❌ Error destroying session:', error);
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
    } catch (error) {
      // console.error('Error validating session:', error);
      return false;
    }
  }
}
