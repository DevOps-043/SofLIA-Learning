import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchActivitySubmissionRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<ActivitySubmissionRecord[]> {
  return fetchUserScopedRows<ActivitySubmissionRecord>('activity submissions', userIds, (chunk, from, to) =>
    supabase
      .from('user_activity_submissions')
      .select(`
        submission_id,
        user_id,
        organization_id,
        course_id,
        lesson_id,
        activity_id,
        enrollment_id,
        status,
        response_text,
        response_payload,
        evidence_payload,
        submitted_at,
        last_validated_at,
        created_at,
        updated_at,
        courses (
          id,
          title
        ),
        lesson_activities (
          activity_id,
          activity_title,
          activity_type,
          lesson_id,
          course_lessons (
            lesson_id,
            module_id,
            course_modules (
              module_id,
              course_id
            )
          )
        )
      `)
      .eq('organization_id', organizationId)
      .in('user_id', chunk)
      .range(from, to),
  )
}
