import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

import {
  attemptsInWindow,
  attemptWindowStart,
  decideWindowedAttempt,
  retryAvailableAt,
} from '../attempt-cooldown'
import { ATTEMPT_COOLDOWN_HOURS, MAX_QUIZ_ATTEMPTS } from '../attempt-limits'
import { fetchLatestAttemptUnlockAt } from '../attempt-unlocks/attempt-unlock.server.service'

/**
 * Límite de intentos de quiz con ventana de enfriamiento (cooldown).
 *
 * SEGURIDAD/PRODUCTO: un alumno puede intentar aprobar un quiz como máximo
 * `MAX_QUIZ_ATTEMPTS` veces dentro de una ventana de `ATTEMPT_COOLDOWN_HOURS`.
 * Al agotarse, se bloquea el envío hasta que el intento más antiguo de la ventana
 * expira, momento en el que se recuperan intentos. Si el alumno ya aprobó, no se
 * consume ni limita nada.
 *
 * Un super-admin puede desbloquear al alumno desde el panel forense: la concesión
 * (`user_attempt_unlocks`) mueve el inicio de la ventana de conteo sin borrar los
 * intentos, de modo que la auditoría conserva la historia completa.
 *
 * El conteo se basa en la tabla append-only `user_quiz_attempts` (una fila por
 * envío). El límite es por-quiz: se filtra por `material_id`/`activity_id` según
 * corresponda, además de `user_id + lesson_id + enrollment_id`.
 *
 * Sigue el mismo patrón que `resolveDialogueAttempt`
 * (features/courses/services/soflia-dialogue/dialogue-session/attempts.ts) y
 * `resolveActivityCompletionAttempt` (app/api/lia/complete-activity).
 */

export { ATTEMPT_COOLDOWN_HOURS, MAX_QUIZ_ATTEMPTS }

export type QuizAttemptDecision =
  | { kind: 'already_passed' }
  | { kind: 'can_attempt'; attemptNumber: number; attemptsRemaining: number }
  | { kind: 'limit_reached'; retryAfter: string; attemptsInWindow: number }

export interface ResolveQuizAttemptInput {
  userId: string
  lessonId: string
  enrollmentId: string
  materialId: string | null
  activityId: string | null
  /** El alumno ya aprobó este quiz: no se limita ni consume intento. */
  alreadyPassed: boolean
}

interface QuizAttemptWindowRow {
  created_at: string
}

/**
 * Determina si el alumno puede realizar un nuevo intento de quiz.
 *
 * Fail-open controlado: si la consulta de conteo falla, se permite el intento
 * (no bloqueamos al alumno por un fallo de infraestructura), pero se registra el
 * error para observabilidad. La fuente de verdad de "aprobado/no" sigue siendo la
 * submission y el gating de progresión.
 */
export async function resolveQuizAttempt(
  supabase: unknown,
  input: ResolveQuizAttemptInput,
  now: Date = new Date(),
): Promise<QuizAttemptDecision> {
  if (input.alreadyPassed) {
    return { kind: 'already_passed' }
  }

  // Un desbloqueo administrativo posterior al inicio de la ventana la acorta: los
  // intentos previos siguen en la tabla (auditoría) pero ya no consumen cupo.
  const unlockedFrom = await fetchLatestAttemptUnlockAt(supabase, {
    userId: input.userId,
    scope: 'quiz',
    lessonId: input.lessonId,
    materialId: input.materialId,
    activityId: input.activityId,
    enrollmentId: input.enrollmentId,
  })
  const windowStart = attemptWindowStart(now, unlockedFrom)

  let query = fromLoose<QuizAttemptWindowRow>(supabase, 'user_quiz_attempts')
    .select('created_at')
    .eq('user_id', input.userId)
    .eq('lesson_id', input.lessonId)
    .eq('enrollment_id', input.enrollmentId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true })

  // El límite es por-quiz concreto: distinguimos material vs actividad.
  query = input.materialId
    ? query.eq('material_id', input.materialId)
    : query.is('material_id', null)
  query = input.activityId
    ? query.eq('activity_id', input.activityId)
    : query.is('activity_id', null)

  const { data, error } = await query

  if (error) {
    logger.error('resolveQuizAttempt: window count failed', {
      error: error.message,
      lessonId: input.lessonId,
    })
    // Fail-open: no bloquear por fallo de lectura.
    return { kind: 'can_attempt', attemptNumber: 1, attemptsRemaining: MAX_QUIZ_ATTEMPTS }
  }

  // La consulta ya filtra por ventana, pero se vuelve a acotar y ordenar aquí para
  // compartir exactamente la misma aritmética que el diálogo y las actividades.
  const windowed = attemptsInWindow(
    (data ?? []).map((row) => row.created_at),
    windowStart,
  )
  const decision = decideWindowedAttempt(windowed, MAX_QUIZ_ATTEMPTS)

  if (decision.isLimitReached) {
    return {
      kind: 'limit_reached',
      retryAfter: decision.retryAfterUtc ?? retryAvailableAt(now.toISOString()),
      attemptsInWindow: decision.attemptsInWindow,
    }
  }

  return {
    kind: 'can_attempt',
    attemptNumber: decision.attemptNumber,
    attemptsRemaining: decision.attemptsRemaining,
  }
}
