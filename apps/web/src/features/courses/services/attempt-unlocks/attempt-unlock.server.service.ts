import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

import { resolveLatestUnlock } from './attempt-unlock.rules'
import type {
  AttemptUnlockRecord,
  AttemptUnlockScope,
  AttemptUnlockTarget,
} from './attempt-unlock.types'

/**
 * Acceso de servidor a `user_attempt_unlocks` (tabla service-role, RLS sin políticas
 * de cliente). El filtrado fino por objetivo se hace en memoria con las reglas puras:
 * el volumen por usuario es mínimo (una fila por concesión del super-admin) y evita
 * construir un `or(...)` frágil con comodines.
 */

interface AttemptUnlockRow {
  unlock_id: string
  scope: string
  lesson_id: string | null
  material_id: string | null
  activity_id: string | null
  enrollment_id: string | null
  effective_from: string
  granted_by: string
  reason: string | null
  created_at: string | null
}

const ATTEMPT_UNLOCK_COLUMNS =
  'unlock_id, scope, lesson_id, material_id, activity_id, enrollment_id, effective_from, granted_by, reason, created_at'

function toRecord(row: AttemptUnlockRow): AttemptUnlockRecord {
  return {
    unlockId: row.unlock_id,
    scope: row.scope as AttemptUnlockScope,
    lessonId: row.lesson_id,
    materialId: row.material_id,
    activityId: row.activity_id,
    enrollmentId: row.enrollment_id,
    effectiveFromUtc: row.effective_from,
    grantedBy: row.granted_by,
    reason: row.reason,
    createdAtUtc: row.created_at,
  }
}

/**
 * Todos los desbloqueos de un usuario (para el panel forense y para resolver varios
 * objetivos sin repetir consultas). Fail-soft: ante un error devuelve lista vacía —
 * un fallo de lectura nunca debe conceder ni denegar intentos de forma silenciosa;
 * el trigger de BD sigue siendo la barrera autoritativa.
 */
export async function fetchAttemptUnlocksForUser(
  supabase: unknown,
  userId: string,
): Promise<AttemptUnlockRecord[]> {
  const { data, error } = await fromLoose<AttemptUnlockRow>(supabase, 'user_attempt_unlocks')
    .select(ATTEMPT_UNLOCK_COLUMNS)
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })
    .limit(500)

  if (error) {
    logger.error('fetchAttemptUnlocksForUser failed', { error: error.message, userId })
    return []
  }

  return (data ?? []).map(toRecord)
}

/**
 * Punto de corte vigente para un objetivo concreto: los intentos anteriores a este
 * instante ya no consumen cupo. `null` si el alumno nunca fue desbloqueado.
 */
export async function fetchLatestAttemptUnlockAt(
  supabase: unknown,
  target: AttemptUnlockTarget,
): Promise<string | null> {
  const { data, error } = await fromLoose<AttemptUnlockRow>(supabase, 'user_attempt_unlocks')
    .select(ATTEMPT_UNLOCK_COLUMNS)
    .eq('user_id', target.userId)
    .eq('scope', target.scope)
    .order('effective_from', { ascending: false })
    .limit(100)

  if (error) {
    logger.error('fetchLatestAttemptUnlockAt failed', {
      error: error.message,
      scope: target.scope,
      userId: target.userId,
    })
    return null
  }

  return resolveLatestUnlock((data ?? []).map(toRecord), target)?.effectiveFromUtc ?? null
}

export interface GrantAttemptUnlockInput extends AttemptUnlockTarget {
  grantedByUserId: string
  reason?: string | null
}

/**
 * Concede un desbloqueo (append-only). Devuelve el registro creado para que la ruta
 * lo audite y la UI lo muestre sin recargar.
 */
export async function grantAttemptUnlock(
  supabase: unknown,
  input: GrantAttemptUnlockInput,
): Promise<AttemptUnlockRecord> {
  const effectiveFrom = new Date().toISOString()

  const { data, error } = await fromLoose<AttemptUnlockRow, Record<string, unknown>>(
    supabase,
    'user_attempt_unlocks',
  )
    .insert({
      user_id: input.userId,
      scope: input.scope,
      lesson_id: input.lessonId ?? null,
      material_id: input.materialId ?? null,
      activity_id: input.activityId ?? null,
      enrollment_id: input.enrollmentId ?? null,
      effective_from: effectiveFrom,
      granted_by: input.grantedByUserId,
      reason: input.reason ?? null,
    })
    .select(ATTEMPT_UNLOCK_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo registrar el desbloqueo de intentos')
  }

  return toRecord(data)
}
