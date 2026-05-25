import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LessonTrackingRecord } from './lesson-tracking-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonTracking(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.lessonIds.size === 0) return []

  const { data, error } = await supabase
    .from('lesson_tracking')
    .select('id, lesson_id, organization_id, status, started_at, completed_at, last_activity_at, t_lesson_minutes, t_video_minutes, t_materials_minutes, updated_at')
    .eq('user_id', userId)
    .in('lesson_id', Array.from(scope.lessonIds))
    .limit(PAGE_LIMIT)
    .returns<LessonTrackingRecord[]>()

  logQueryError('business user lesson tracking', error)
  return (data || []).filter((tracking) =>
    tracking.organization_id === organizationId ||
    tracking.organization_id === null ||
    scope.lessonIds.has(tracking.lesson_id),
  )
}
