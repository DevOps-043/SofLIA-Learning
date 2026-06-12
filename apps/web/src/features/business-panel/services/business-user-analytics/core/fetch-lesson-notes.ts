import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { LessonNoteRecord } from './lesson-note-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonNotes(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  _organizationId: string,
  scope: AnalyticsScope,
) {
  if (scope.enrollmentIds.size === 0) return []

  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select('note_id, enrollment_id, lesson_id, organization_id, note_title, note_content, is_auto_generated, source_type, created_at, updated_at')
    .eq('user_id', userId)
    .in('enrollment_id', Array.from(scope.enrollmentIds))
    .limit(PAGE_LIMIT)
    .returns<LessonNoteRecord[]>()

  logQueryError('business user lesson notes', error)
  // El scope por `enrollment_id` ya garantiza la organización (cada enrollment =
  // usuario + curso + organización), así que no se vuelve a filtrar por org: hacerlo
  // descartaba notas en la vista admin multi-org y rompía el conteo.
  return data || []
}
