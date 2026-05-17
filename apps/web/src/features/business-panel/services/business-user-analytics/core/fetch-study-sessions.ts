import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { StudySessionRecord } from './study-session-record'

export async function fetchStudySessions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('id, course_id, organization_id, status, start_time, end_time, completed_at, started_at, duration_minutes, actual_duration_minutes, was_rescheduled, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<StudySessionRecord[]>()

  logQueryError('business user study sessions', error)
  return (data || []).filter((session) =>
    session.organization_id === organizationId ||
    (session.course_id ? scope.courseIds.has(session.course_id) : false),
  )
}
