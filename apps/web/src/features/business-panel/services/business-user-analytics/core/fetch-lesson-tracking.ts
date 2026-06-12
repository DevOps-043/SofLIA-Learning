import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LessonTrackingRecord } from './lesson-tracking-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonTracking(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  _organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('lesson_tracking')
    .select('id, enrollment_id, lesson_id, organization_id, status, started_at, completed_at, last_activity_at, t_lesson_minutes, t_video_minutes, t_materials_minutes, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<LessonTrackingRecord[]>()

  logQueryError('business user lesson tracking', error)
  // El scope por `enrollment_id` ya garantiza la organización; no se re-filtra por org.
  return data || []
}
