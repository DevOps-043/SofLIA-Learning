import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
  enrichLessonWithInstructorName,
  fetchInstructorNameMap,
  type AdminLessonsSupabaseClient,
} from './shared'
import type { AdminLesson } from './types'

export async function translateCreatedLesson(
  lesson: AdminLesson,
  userId?: string,
) {
  try {
    const { translateLessonOnCreate } = await import(
      '@/core/services/courseTranslation.service'
    )

    await translateLessonOnCreate(
      lesson.lesson_id,
      {
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description,
        transcript_content: lesson.transcript_content,
        summary_content: lesson.summary_content,
      },
      userId,
    )
  } catch (translationError) {
    techDebtLogger.error('Error en traducción automática de la lección:', translationError)
  }
}

export async function enrichSingleLesson(
  supabase: AdminLessonsSupabaseClient,
  lesson: AdminLesson,
): Promise<AdminLesson> {
  const instructorNameMap = await fetchInstructorNameMap(
    supabase,
    lesson.instructor_id ? [lesson.instructor_id] : [],
  )

  return enrichLessonWithInstructorName(lesson, instructorNameMap)
}
