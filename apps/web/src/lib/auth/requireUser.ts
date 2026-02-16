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
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface UserAuth {
  userId: string;
  userEmail: string;
  userRole: string;
}

/**
 * Verifica que el usuario esté autenticado (cualquier rol)
 */
export async function requireUser(): Promise<UserAuth | NextResponse> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aprende-y-aplica-session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    const sessionToken = sessionCookie.value;
    const supabase = await createClient();

    const { data: session, error: sessionError } = await supabase
      .from('user_session')
      .select('user_id, expires_at, revoked')
      .eq('jwt_id', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Sesión inválida. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    if (session.revoked) {
      return NextResponse.json(
        { success: false, error: 'Sesión revocada. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Sesión expirada. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado.' },
        { status: 401 }
      );
    }

    logger.debug('User authenticated', { userId: user.id, role: user.cargo_rol });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
    };

  } catch (error) {
    logger.error('Error in requireUser middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
