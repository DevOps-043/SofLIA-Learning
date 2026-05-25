import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { EnrollmentRecord } from './enrollment-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchEnrollmentRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
): Promise<EnrollmentRecord[]> {
  return fetchUserScopedRows<EnrollmentRecord>('enrollments', userIds, (chunk, from, to) =>
    supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        user_id,
        course_id,
        enrollment_status,
        overall_progress_percentage,
        enrolled_at,
        started_at,
        completed_at,
        last_accessed_at,
        updated_at,
        courses (
          id,
          title
        )
      `)
      .in('user_id', chunk)
      .range(from, to),
  )
}
