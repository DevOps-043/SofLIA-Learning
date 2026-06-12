import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

export interface RecordQuizAttemptInput {
  userId: string
  lessonId: string
  enrollmentId: string
  materialId: string | null
  activityId: string | null
  organizationId: string | null
  score: number
  totalPoints: number
  percentageScore: number
  isPassed: boolean
  durationSeconds: number | null
  completedAt: string
}

/**
 * Registra un intento de quiz en `user_quiz_attempts` (append-only). A diferencia de
 * `user_quiz_submissions` (que guarda solo la fila mejor/actual y sobrescribe los
 * reintentos), aquí se inserta una fila por CADA envío, preservando el historial real
 * de intentos para analytics. `attempt_number` se calcula como (intentos previos de
 * ese user+lesson+enrollment) + 1.
 *
 * Es "best-effort": si falla, se registra el error pero NO se bloquea el envío del
 * quiz (la submission y el progreso siguen siendo la fuente de verdad operativa).
 */
export async function recordQuizAttempt(
  supabase: unknown,
  input: RecordQuizAttemptInput,
): Promise<void> {
  try {
    const { count } = await fromLoose(supabase, 'user_quiz_attempts')
      .select('attempt_id', { count: 'exact', head: true })
      .eq('user_id', input.userId)
      .eq('lesson_id', input.lessonId)
      .eq('enrollment_id', input.enrollmentId)

    const attemptNumber = (count ?? 0) + 1

    const { error } = await fromLoose(supabase, 'user_quiz_attempts').insert({
      user_id: input.userId,
      lesson_id: input.lessonId,
      enrollment_id: input.enrollmentId,
      material_id: input.materialId,
      activity_id: input.activityId,
      organization_id: input.organizationId,
      score: input.score,
      total_points: input.totalPoints,
      percentage_score: input.percentageScore,
      is_passed: input.isPassed,
      duration_seconds: input.durationSeconds,
      attempt_number: attemptNumber,
      created_at: input.completedAt,
    })

    if (error) {
      logger.error('recordQuizAttempt: insert failed', { error: error.message })
    }
  } catch (error) {
    logger.error('recordQuizAttempt: unexpected error', error)
  }
}
