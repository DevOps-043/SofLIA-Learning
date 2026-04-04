/**
 * Middleware de autenticación para cualquier usuario autenticado
 *
 * Similar a requireAdmin pero sin restricción de cargo_rol.
 * Útil para rutas que necesitan un usuario autenticado sin importar su rol.
 *
 * Uso en route handlers:
 * ```typescript
 * import { requireUser } from '@/lib/auth/requireUser';
 *
 * export async function POST(request: NextRequest) {
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *
 *   const { userId, userEmail, userRole } = auth;
 *   // ... resto del código
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface UserAuth {
  userId: string;
  userEmail: string;
  userRole: string;
}

/**
 * Verifica que el usuario esté autenticado (cualquier rol).
 *
 * Soporta DOS sistemas de sesión:
 * 1. Legacy: cookie 'aprende-y-aplica-session' → tabla user_session
 * 2. Nuevo:  cookies 'access_token' + 'refresh_token' → tabla refresh_tokens (SHA-256)
 *
 * El middleware principal (src/middleware.ts) ya valida ambos sistemas en las rutas protegidas.
 * Esta función extiende esa validación a los route handlers de la API.
 */
export async function requireUser(options: { allowBanned?: boolean } = {}): Promise<UserAuth | NextResponse> {
  const { allowBanned = false } = options;
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    let userId: string | null = null;

    // SISTEMA 1: Legacy session (cookie aprende-y-aplica-session → tabla user_session)
    const sessionCookie = cookieStore.get('aprende-y-aplica-session');
    if (sessionCookie) {
      const { data: session } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionCookie.value)
        .single();

      if (session && !session.revoked && new Date(session.expires_at) > new Date()) {
        userId = session.user_id;
      }
    }

    // SISTEMA 2: Refresh tokens (cookies access_token + refresh_token → tabla refresh_tokens)
    if (!userId) {
      const refreshTokenCookie = cookieStore.get('refresh_token');
      const accessTokenCookie = cookieStore.get('access_token');
      if (refreshTokenCookie && accessTokenCookie) {
        const tokenHash = crypto.createHash('sha256').update(refreshTokenCookie.value).digest('hex');
        const { data: tokenData } = await supabase
          .from('refresh_tokens')
          .select('user_id')
          .eq('token_hash', tokenHash)
          .eq('is_revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single();
        if (tokenData?.user_id) userId = tokenData.user_id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol, is_banned')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado.' },
        { status: 401 }
      );
    }

    // ⛔ Verificar si el usuario está baneado globalmente
    if (user.is_banned && !allowBanned) {
      return NextResponse.json(
        { success: false, error: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.' },
        { status: 403 }
      );
    }

    logger.debug('User authenticated', { userId: user.id, role: user.cargo_rol });

    return {
      userId: user.id,
      userEmail: user.email ?? '',
      userRole: user.cargo_rol ?? '',
    };

  } catch (error) {
    logger.error('Error in requireUser middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
