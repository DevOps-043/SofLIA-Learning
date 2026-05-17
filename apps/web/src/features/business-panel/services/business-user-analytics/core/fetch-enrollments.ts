import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { EnrollmentRecord } from './enrollment-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchEnrollments(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, course_id, organization_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<EnrollmentRecord[]>()

  logQueryError('business user enrollments', error)
  return data || []
}
