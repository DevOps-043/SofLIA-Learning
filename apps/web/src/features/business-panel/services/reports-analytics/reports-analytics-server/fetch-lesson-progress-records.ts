import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { LessonProgressRecord } from './lesson-progress-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchLessonProgressRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
): Promise<LessonProgressRecord[]> {
  return fetchUserScopedRows<LessonProgressRecord>('lesson progress', userIds, (chunk, from, to) =>
    supabase
      .from('user_lesson_progress')
      .select(`
        progress_id,
        user_id,
        lesson_status,
        is_completed,
        time_spent_minutes,
        completed_at,
        started_at,
        last_accessed_at,
        updated_at,
        enrollment_id,
        lesson_id,
        user_course_enrollments!inner (
          course_id,
          courses (
            id,
            title
          )
        )
      `)
      .in('user_id', chunk)
      .range(from, to),
  )
}
