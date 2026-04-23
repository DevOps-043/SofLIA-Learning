import { LessonProgressError } from '../lesson-progress.shared'
import type { LessonRow, SupabaseServerClient } from './types'

export async function validatePreviousLessonCompletion(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  lessons: LessonRow[],
  lessonIndex: number,
) {
  if (lessonIndex <= 0) return

  const previousLesson = lessons[lessonIndex - 1]
  const { data: previousProgress } = await supabase
    .from('user_lesson_progress')
    .select('is_completed')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', previousLesson.lesson_id)
    .single()

  if (!previousProgress?.is_completed) {
    throw new LessonProgressError(
      'PREVIOUS_LESSON_NOT_COMPLETED',
      400,
      'Debes completar la leccion anterior antes de completar esta',
    )
  }
}
