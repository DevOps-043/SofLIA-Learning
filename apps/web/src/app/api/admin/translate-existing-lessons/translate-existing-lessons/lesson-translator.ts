import { translateLessonOnCreate } from '@/core/services/courseTranslation.service'
import { computeMissingLanguages } from './missing-languages'
import {
  createAlreadyTranslatedProgress,
  createFailedProgress,
  createTranslationProgress,
} from './entity-progress'
import type { EntityProgress, LessonRow, TranslationSupabaseClient } from './types'

export async function translateLessonEntity(
  supabase: TranslationSupabaseClient,
  lesson: LessonRow,
  userId: string,
): Promise<EntityProgress> {
  const identity = {
    entityType: 'lesson' as const,
    entityId: lesson.lesson_id,
    title: lesson.lesson_title,
    courseId: lesson.course_modules.course_id,
  }

  try {
    const { missingLanguages } = await computeMissingLanguages(
      supabase,
      'lesson',
      lesson.lesson_id,
      [lesson.lesson_title, lesson.lesson_description || ''],
    )
    if (missingLanguages.length === 0) return createAlreadyTranslatedProgress(identity)

    const translationResult = await translateLessonOnCreate(
      lesson.lesson_id,
      {
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description,
        transcript_content: lesson.transcript_content,
        summary_content: lesson.summary_content,
      },
      userId,
    )

    return createTranslationProgress(
      identity,
      missingLanguages,
      translationResult.languages || [],
      translationResult.errors,
    )
  } catch (error) {
    return createFailedProgress(identity, error)
  }
}
