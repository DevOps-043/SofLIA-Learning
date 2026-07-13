import 'server-only'

import { createAdminClient } from '../supabase/admin'
import { logger } from '../logger'
import { SECURE_COOKIE_OPTIONS } from './cookie-config'

/**
 * Tracking de última actividad del usuario (`users.last_activity_at`).
 *
 * `last_login_at` solo se mueve cuando el usuario re-autentica con credenciales
 * (password / MFA / OAuth). Las sesiones persistentes se renuevan en silencio
 * durante 7-30 días, así que un usuario activo puede aparentar semanas de
 * inactividad en los paneles. Esta columna registra la actividad real.
 *
 * Throttle: la cookie `ACTIVITY_SYNC_COOKIE_NAME` (maxAge 15 min) marca que la
 * actividad ya fue sincronizada recientemente; mientras exista, no se escribe.
 * Resultado: máximo 1 UPDATE por PK cada 15 min por usuario — costo
 * despreciable incluso con miles de usuarios concurrentes.
 */

export const ACTIVITY_SYNC_COOKIE_NAME = 'soflia_activity_sync'

const ACTIVITY_SYNC_INTERVAL_SECONDS = 15 * 60

export function buildActivitySyncCookieOptions() {
  return {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: ACTIVITY_SYNC_INTERVAL_SECONDS,
  }
}

/**
 * Registra actividad del usuario. Nunca lanza: la sincronización de actividad
 * es best-effort y jamás debe romper una navegación o un refresh de sesión.
 */
export async function touchUserLastActivity(userId: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('users')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      logger.warn('No se pudo actualizar last_activity_at', { userId, error })
    }
  } catch (error) {
    logger.warn('Error inesperado actualizando last_activity_at', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
