import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { ActivityCompletionRecord } from './activity-completion-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchActivityCompletionRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
): Promise<ActivityCompletionRecord[]> {
  return fetchUserScopedRows<ActivityCompletionRecord>('activity completions', userIds, (chunk, from, to) =>
    supabase
      .from('lia_activity_completions')
      .select(`
        completion_id,
        user_id,
        activity_id,
        status,
        completed_steps,
        total_steps,
        time_to_complete_seconds,
        attempts_to_complete,
        user_needed_help,
        lia_had_to_redirect,
        generated_output,
        completed_at,
        started_at,
        updated_at,
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
      .in('user_id', chunk)
      .range(from, to),
  )
}
