import { headers } from 'next/headers'

import { logger } from '@/lib/logger'
import { escapeIlikePattern } from '@/lib/supabase/ilike-escape'

import type { LoginSupabaseClient, LoginUserRecord } from './types'

// La contraseña ya no vive en `public.users`: la verifica Supabase Auth contra
// `auth.users`. La columna `password_hash` (y la validación bcrypt legacy que
// la usaba) se han eliminado — los 30 usuarios tienen credenciales nativas.
const LOGIN_USER_COLUMNS =
  'id, username, email, email_verified, platform_role, is_banned, ban_reason, first_name, last_name, display_name, profile_picture_url'

/**
 * Cota de filas por búsqueda. Existen cuentas cuyo username solo difiere en
 * mayúsculas (p. ej. "TobiasZorro" y "tobiaszorro"), así que la búsqueda
 * case-insensitive puede devolver más de una fila.
 */
const LOGIN_LOOKUP_LIMIT = 10

/**
 * Elige la fila correcta cuando la búsqueda case-insensitive devuelve varias.
 * Prioriza la coincidencia EXACTA (respetando mayúsculas) sobre la primera fila,
 * que es arbitraria; si no hay exacta y hay ambigüedad real, no adivina.
 */
function pickExactMatch(
  rows: LoginUserRecord[],
  field: 'username' | 'email',
  identifier: string,
): LoginUserRecord | null {
  if (rows.length === 0) return null
  if (rows.length === 1) return rows[0]

  const exact = rows.find((row) => row[field] === identifier)
  if (exact) return exact

  // Varias coincidencias que solo difieren en mayúsculas y ninguna exacta:
  // elegir una al azar podría autenticar contra la cuenta equivocada.
  logger.warn('Login lookup ambiguo: varias cuentas coinciden sin match exacto', {
    field,
    matches: rows.length,
  })
  return null
}

/**
 * Busca al usuario por username o email (case-insensitive).
 *
 * NO usa `.maybeSingle()`: PostgREST lo trata como error cuando hay más de una
 * fila, y con usernames que solo difieren en mayúsculas eso devolvía `null`
 * (es decir, "usuario no encontrado" y "Credenciales inválidas") para cuentas
 * perfectamente válidas.
 */
export async function findLoginUser(
  supabase: LoginSupabaseClient,
  emailOrUsername: string
): Promise<LoginUserRecord | null> {
  const normalized = emailOrUsername.trim()
  if (!normalized) {
    return null
  }

  const pattern = escapeIlikePattern(normalized)

  const [byUsername, byEmail] = await Promise.all([
    supabase
      .from('users')
      .select(LOGIN_USER_COLUMNS)
      .ilike('username', pattern)
      .limit(LOGIN_LOOKUP_LIMIT)
      .returns<LoginUserRecord[]>(),
    supabase
      .from('users')
      .select(LOGIN_USER_COLUMNS)
      .ilike('email', pattern)
      .limit(LOGIN_LOOKUP_LIMIT)
      .returns<LoginUserRecord[]>(),
  ])

  if (byUsername.error) {
    logger.error('Login lookup by username failed', {
      code: byUsername.error.code,
      message: byUsername.error.message,
    })
  }
  if (byEmail.error) {
    logger.error('Login lookup by email failed', {
      code: byEmail.error.code,
      message: byEmail.error.message,
    })
  }

  const usernameMatch = pickExactMatch(
    byUsername.data ?? [],
    'username',
    normalized,
  )
  if (usernameMatch) return usernameMatch

  return pickExactMatch(byEmail.data ?? [], 'email', normalized)
}

export async function findLoginUserById(
  supabase: LoginSupabaseClient,
  userId: string
): Promise<LoginUserRecord | null> {
  const { data, error } = await supabase
    .from('users')
    .select(LOGIN_USER_COLUMNS)
    .eq('id', userId)
    .maybeSingle<LoginUserRecord>()

  if (error) {
    logger.error('Login lookup by id failed', {
      code: error.code,
      message: error.message,
    })
  }

  return data ?? null
}

/**
 * Traduce un fallo de Supabase Auth a un mensaje correcto para el usuario.
 *
 * Contexto: tras la migración, las cuentas nativas NO tienen `password_hash` en
 * `public.users` (la contraseña vive solo en `auth.users`). Antes, cualquier
 * fallo del login nativo caía en la validación legacy, que al no encontrar hash
 * respondía "Error en la configuración de la cuenta. Contacta al soporte."
 * Resultado: una simple contraseña mal escrita —o un rate limit de Supabase—
 * se presentaba como una cuenta corrupta. Aquí cada causa dice lo que es.
 */
export function mapNativeAuthFailure(reason: string): {
  debugCode: string
  error: string
} {
  const normalized = reason.toLowerCase()

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_credentials')
  ) {
    return {
      debugCode: 'SUPABASE_AUTH_PASSWORD_MISMATCH',
      error: 'Credenciales invalidas',
    }
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('over_request_rate_limit')
  ) {
    return {
      debugCode: 'AUTH_RATE_LIMITED',
      error:
        'Demasiados intentos de inicio de sesion. Espera unos minutos e intenta de nuevo.',
    }
  }

  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('email_not_confirmed')
  ) {
    return {
      debugCode: 'AUTH_EMAIL_NOT_CONFIRMED',
      error:
        'Tu correo aun no esta confirmado. Revisa tu bandeja de entrada para activarlo.',
    }
  }

  // Estos SÍ son problemas de configuración reales: la cuenta no puede
  // autenticarse de ninguna forma. Aquí el mensaje de soporte es el correcto.
  if (normalized.includes('missing_email')) {
    return {
      debugCode: 'MISSING_EMAIL',
      error:
        'Tu cuenta no tiene un correo asociado. Por favor, contacta al soporte.',
    }
  }

  if (normalized.includes('auth_user_not_found')) {
    return {
      debugCode: 'AUTH_USER_NOT_FOUND',
      error:
        'Error en la configuracion de la cuenta. Por favor, contacta al soporte.',
    }
  }

  return {
    debugCode: 'AUTH_SERVICE_ERROR',
    error:
      'No se pudo iniciar sesion en este momento. Por favor, intenta de nuevo en unos minutos.',
  }
}

/**
 * Notifica al usuario un intento de acceso fallido.
 *
 * Antes vivía dentro de la validación bcrypt legacy, que ya no existe: la
 * contraseña se verifica exclusivamente contra Supabase Auth, así que la
 * notificación se dispara desde el flujo de login cuando el proveedor rechaza
 * las credenciales.
 */
export async function notifyFailedLogin(userId: string): Promise<void> {
  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await AutoNotificationsService.notifyLoginFailed(userId, ip, userAgent, {
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Login feedback must not expose notification failures.
  }
}
