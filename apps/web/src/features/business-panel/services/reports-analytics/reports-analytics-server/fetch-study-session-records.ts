import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'
import type { StudySessionRecord } from './study-session-record'

export function fetchStudySessionRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
  dateRange: { from: string; to: string },
): Promise<StudySessionRecord[]> {
  return fetchUserScopedRows<StudySessionRecord>('study sessions', userIds, (chunk, from, to) =>
    supabase
      .from('study_sessions')
      .select(`
        id,
        user_id,
        course_id,
        status,
        start_time,
        end_time,
        completed_at,
        started_at,
        duration_minutes,
        actual_duration_minutes,
        was_rescheduled,
        updated_at,
        courses (
          id,
          title
        )
      `)
      .in('user_id', chunk)
      .gte('start_time', dateRange.from)
      .lte('start_time', dateRange.to)
      .range(from, to),
  )
}
