import { fetchUserScopedRows } from './fetch-user-scoped-rows'
import type { LessonNoteRecord } from './lesson-note-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchLessonNoteRecords(
  supabase: ReportsAnalyticsSupabaseClient,
  userIds: string[],
  dateRange: { from: string; to: string },
): Promise<LessonNoteRecord[]> {
  return fetchUserScopedRows<LessonNoteRecord>('lesson notes', userIds, (chunk, from, to) =>
    supabase
      .from('user_lesson_notes')
      .select(`
        note_id,
        user_id,
        lesson_id,
        note_title,
        note_content,
        is_auto_generated,
        source_type,
        created_at,
        updated_at,
        course_lessons (
          lesson_id,
          module_id,
          course_modules (
            module_id,
            course_id
          )
        )
      `)
      .in('user_id', chunk)
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .range(from, to),
  )
}
