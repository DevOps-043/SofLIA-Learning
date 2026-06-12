import { fromLoose } from '@/lib/supabase/looseQuery'
import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { QuizAttemptRecord } from './quiz-attempt-record'

/**
 * Historial de intentos de quiz del usuario, acotado por enrollment (separación por
 * organización). Lee `user_quiz_attempts` (append-only). Usa `fromLoose` porque la
 * tabla no está en los tipos generados de `Database`.
 */
export async function fetchQuizAttempts(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
): Promise<QuizAttemptRecord[]> {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await fromLoose<QuizAttemptRecord>(supabase, 'user_quiz_attempts')
    .select('attempt_id, lesson_id, enrollment_id, percentage_score, is_passed, attempt_number, created_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)

  logQueryError('business user quiz attempts', error)
  return data || []
}
