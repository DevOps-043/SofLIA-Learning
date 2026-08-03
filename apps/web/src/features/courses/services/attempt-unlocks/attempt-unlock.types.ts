/**
 * Desbloqueo administrativo de intentos.
 *
 * Un desbloqueo NO borra intentos: registra un punto de corte (`effectiveFromUtc`)
 * a partir del cual los motores de intentos (quiz, diálogo SofLIA y actividades LIA)
 * vuelven a contar desde cero. La auditoría forense conserva la historia completa.
 */

export type AttemptUnlockScope = 'quiz' | 'dialogue' | 'lia_activity'

export const ATTEMPT_UNLOCK_SCOPES: readonly AttemptUnlockScope[] = [
  'quiz',
  'dialogue',
  'lia_activity',
] as const

/** Objetivo concreto sobre el que se consulta o concede un desbloqueo. */
export interface AttemptUnlockTarget {
  userId: string
  scope: AttemptUnlockScope
  lessonId?: string | null
  materialId?: string | null
  activityId?: string | null
  enrollmentId?: string | null
}

/** Fila normalizada de `user_attempt_unlocks`. */
export interface AttemptUnlockRecord {
  unlockId: string
  scope: AttemptUnlockScope
  lessonId: string | null
  materialId: string | null
  activityId: string | null
  enrollmentId: string | null
  effectiveFromUtc: string
  grantedBy: string
  reason: string | null
  createdAtUtc: string | null
}
