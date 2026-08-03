import type { AttemptUnlockRecord, AttemptUnlockTarget } from './attempt-unlock.types'

/**
 * Reglas puras del desbloqueo de intentos (sin BD, unit-testeables).
 *
 * Un desbloqueo aplica a un objetivo cuando cada referencia del registro o bien
 * coincide con la del objetivo, o bien es nula (comodín): así un desbloqueo de
 * "el quiz de esta lección" cubre todos sus materiales, y uno de "esta actividad"
 * cubre cualquier inscripción. Es la misma semántica que implementa
 * `public.latest_attempt_unlock_at` en la base de datos: si divergen, el motor
 * que bloquea de verdad es el trigger.
 */

function refMatches(recordRef: string | null, targetRef: string | null | undefined): boolean {
  if (recordRef === null) return true
  return recordRef === (targetRef ?? null)
}

export function unlockAppliesToTarget(
  record: AttemptUnlockRecord,
  target: AttemptUnlockTarget,
): boolean {
  return (
    record.scope === target.scope &&
    refMatches(record.lessonId, target.lessonId) &&
    refMatches(record.materialId, target.materialId) &&
    refMatches(record.activityId, target.activityId) &&
    refMatches(record.enrollmentId, target.enrollmentId)
  )
}

/** Desbloqueo vigente (el más reciente) para el objetivo, o `null` si no hay ninguno. */
export function resolveLatestUnlock(
  records: AttemptUnlockRecord[],
  target: AttemptUnlockTarget,
): AttemptUnlockRecord | null {
  let latest: AttemptUnlockRecord | null = null
  let latestMs = Number.NEGATIVE_INFINITY

  for (const record of records) {
    if (!unlockAppliesToTarget(record, target)) continue
    const ms = Date.parse(record.effectiveFromUtc)
    if (Number.isNaN(ms) || ms <= latestMs) continue
    latest = record
    latestMs = ms
  }

  return latest
}

/**
 * Inicio efectivo de la ventana de conteo: el más reciente entre el arranque de la
 * ventana de enfriamiento y el último desbloqueo. Devuelve ISO UTC.
 */
export function resolveCountingWindowStart(
  cooldownStartUtc: string,
  unlockedFromUtc: string | null,
): string {
  if (!unlockedFromUtc) return cooldownStartUtc
  const cooldownMs = Date.parse(cooldownStartUtc)
  const unlockMs = Date.parse(unlockedFromUtc)
  if (Number.isNaN(unlockMs)) return cooldownStartUtc
  if (Number.isNaN(cooldownMs)) return unlockedFromUtc
  return unlockMs > cooldownMs ? unlockedFromUtc : cooldownStartUtc
}

/** Un intento solo cuenta si ocurrió en o después del punto de corte vigente. */
export function attemptCountsAfterUnlock(
  attemptAtUtc: string | null,
  unlockedFromUtc: string | null,
): boolean {
  if (!unlockedFromUtc) return true
  if (!attemptAtUtc) return false
  const attemptMs = Date.parse(attemptAtUtc)
  const unlockMs = Date.parse(unlockedFromUtc)
  if (Number.isNaN(attemptMs) || Number.isNaN(unlockMs)) return true
  return attemptMs >= unlockMs
}
