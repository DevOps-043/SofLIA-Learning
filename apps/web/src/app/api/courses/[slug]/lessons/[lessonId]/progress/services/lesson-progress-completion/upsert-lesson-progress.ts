import { LessonProgressError } from '../lesson-progress.shared'
import type { SupabaseServerClient } from './types'

// KNOWN LIMITATION: This is a manual check-then-write, not a true atomic UPSERT.
// Concurrent requests for the same (enrollment_id, lesson_id) could both see no
// existing progress and both attempt INSERT, causing a unique constraint error.
// A DB-level UPSERT via a migration (adding ON CONFLICT clause) would fix this.
// In practice, concurrent lesson completions for the same user are very rare.
export async function upsertLessonProgress(
  supabase: SupabaseServerClient,
  userId: string,
  lessonId: string,
  enrollmentId: string,
  now: string,
) {
  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('progress_id')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .single()

  if (existingProgress) {
    const { error } = await supabase
      .from('user_lesson_progress')
      .update({
        is_completed: true,
        lesson_status: 'completed',
        completed_at: now,
        video_progress_percentage: 100,
        last_accessed_at: now,
        updated_at: now,
      })
      .eq('progress_id', existingProgress.progress_id)

    if (error) throw new LessonProgressError('LESSON_PROGRESS_UPDATE_FAILED', 500, 'Error al actualizar progreso')
    return
  }

  const { error } = await supabase.from('user_lesson_progress').insert({
    user_id: userId,
    lesson_id: lessonId,
    enrollment_id: enrollmentId,
    is_completed: true,
    lesson_status: 'completed',
    video_progress_percentage: 100,
    completed_at: now,
    started_at: now,
    last_accessed_at: now,
  })

  if (error) throw new LessonProgressError('LESSON_PROGRESS_INSERT_FAILED', 500, 'Error al guardar progreso')
}
