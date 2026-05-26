import type { createClient } from '@/lib/supabase/server'
import { authFailure, authSuccess } from './result'
import type { AuthResult, AuthenticatedBusinessUser, BusinessAccessMode } from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface UserLoggerLike {
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void
}

function normalizeRole(role: string | null | undefined): string {
  return role?.toLowerCase().trim() ?? ''
}

export function isAllowedBusinessRole(
  role: string | null | undefined,
  mode: BusinessAccessMode = 'business-admin',
): boolean {
  const normalizedRole = normalizeRole(role)
  if (mode === 'business-user') {
    return (
      normalizedRole === 'business user' ||
      normalizedRole === 'business' ||
      normalizedRole === 'administrador'
    )
  }

  return normalizedRole === 'business' || normalizedRole === 'administrador'
}

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'administrador'
}

export async function loadAuthenticatedBusinessUser(
  supabase: SupabaseClient,
  userId: string,
  logger: UserLoggerLike,
  mode: BusinessAccessMode = 'business-admin',
): Promise<AuthResult<AuthenticatedBusinessUser>> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, cargo_rol')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    logger.error('User not found for valid session', undefined, {
      userId,
      error: userError?.message,
    })
    return authFailure(401, 'Usuario no encontrado.')
  }

  if (!isAllowedBusinessRole(user.cargo_rol, mode)) {
    logger.warn('Unauthorized access attempt - invalid role', {
      userId: user.id,
      role: user.cargo_rol,
      normalizedRole: normalizeRole(user.cargo_rol),
      mode,
    })
    return authFailure(
      403,
      `Permisos insuficientes. Se requiere rol permitido para ${mode}. Rol actual: ${
        user.cargo_rol || 'sin rol'
      }`,
    )
  }

  return authSuccess({
    ...user,
    isPlatformAdmin: isPlatformAdminRole(user.cargo_rol),
  })
}
