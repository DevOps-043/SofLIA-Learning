import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LessonNoteRecord } from './lesson-note-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonNotes(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select('note_id, lesson_id, organization_id, note_title, note_content, is_auto_generated, source_type, created_at, updated_at')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<LessonNoteRecord[]>()

  logQueryError('business user lesson notes', error)
  return (data || []).filter((note) =>
    note.organization_id === organizationId ||
    scope.lessonIds.has(note.lesson_id),
  )
}
