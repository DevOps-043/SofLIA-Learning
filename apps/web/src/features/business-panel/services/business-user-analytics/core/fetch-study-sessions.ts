import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { StudySessionRecord } from './study-session-record'

/**
 * Sesiones del planner del usuario, acotadas por enrollment para separar el progreso
 * por organización (cada `enrollment_id` = usuario + curso + organización). Requiere
 * la migración que añade `enrollment_id` a `study_sessions` (20260611130000).
 */
export async function fetchStudySessions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  _organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, enrollment_id, course_id, organization_id, status, start_time, end_time, completed_at, started_at, duration_minutes, actual_duration_minutes, was_rescheduled, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<StudySessionRecord[]>()

  logQueryError('business user study sessions', error)
  return data || []
}
