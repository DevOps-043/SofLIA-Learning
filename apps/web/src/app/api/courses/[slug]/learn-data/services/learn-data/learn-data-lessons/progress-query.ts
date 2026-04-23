import type { ProgressRow, SupabaseServerClient } from './types'

export async function loadLessonProgressData(
  supabase: SupabaseServerClient,
  enrollmentId: string | null,
  lessonIds: string[],
) {
  if (!enrollmentId || lessonIds.length === 0) return [] as ProgressRow[]

  const { data } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed, lesson_status, video_progress_percentage, last_accessed_at, started_at')
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', lessonIds)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })

  return (data || []) as ProgressRow[]
}
