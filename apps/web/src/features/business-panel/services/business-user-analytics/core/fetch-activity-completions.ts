import { ActivityCompletionRecord } from './activity-completion-record'
import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Completions legacy de actividades guiadas (`lia_activity_completions`), acotadas
 * por enrollment para mantener la separación por organización: cada `enrollment_id`
 * encierra (usuario, curso, organización). Requiere la migración que añade
 * `enrollment_id` a esta tabla (20260611130000).
 */
export async function fetchActivityCompletions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('lia_activity_completions')
    .select(`
      completion_id,
      activity_id,
      enrollment_id,
      organization_id,
      status,
      completed_steps,
      total_steps,
      time_to_complete_seconds,
      attempts_to_complete,
      completed_at,
      started_at,
      updated_at,
      lesson_activities (
        activity_id,
        lesson_id,
        course_lessons (
          lesson_id,
          course_modules (
            course_id
          )
        )
      )
    `)
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<ActivityCompletionRecord[]>()

  logQueryError('business user SofLIA activity completions', error)
  return data || []
}
