import { ActivitySubmissionRecord } from './activity-submission-record'
import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchActivitySubmissions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_activity_submissions')
    .select('submission_id, course_id, enrollment_id, activity_id, organization_id, status, response_text, response_payload, submitted_at, last_validated_at, created_at, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<ActivitySubmissionRecord[]>()

  logQueryError('business user activity submissions', error)
  return data || []
}
