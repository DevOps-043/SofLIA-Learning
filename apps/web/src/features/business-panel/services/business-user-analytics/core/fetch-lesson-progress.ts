import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LessonProgressRecord } from './lesson-progress-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonProgress(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('progress_id, enrollment_id, lesson_id, organization_id, lesson_status, is_completed, time_spent_minutes, completed_at, started_at, last_activity_submission_at, last_accessed_at, updated_at, activity_progress_percentage, quiz_progress_percentage, required_activities_completed, required_activities_total')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<LessonProgressRecord[]>()

  logQueryError('business user lesson progress', error)
  return data || []
}
