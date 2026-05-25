import { translateLessonOnCreate } from '@/core/services/courseTranslation.service'

import { computeMissingLanguages } from './languages'
import { processLessonActivities } from './activity-processing'
import { processLessonMaterials } from './material-processing'
import {
  buildFailedProgress,
  buildTranslatedProgress,
  buildTranslationProgress,
} from './progress'
import { ensureCourseReport, updateReport } from './reporting'
import type {
  LessonTranslationRow,
  TranslationRequestOptions,
  TranslationRunContext,
} from './types'

export async function processLessonTranslations(
  context: TranslationRunContext,
  lesson: LessonTranslationRow,
  options: TranslationRequestOptions
): Promise<void> {
  const courseId = lesson.course_modules.course_id
  const report = ensureCourseReport(context.reports, courseId)

  try {
    const { missingLanguages } = await computeMissingLanguages(
      context.supabase,
      'lesson',
      lesson.lesson_id,
      [lesson.lesson_title, lesson.lesson_description || '']
    )

    if (missingLanguages.length === 0) {
      const progress = buildTranslatedProgress({
        courseId,
        entityId: lesson.lesson_id,
        entityType: 'lesson',
        title: lesson.lesson_title,
      })
      context.details.push(progress)
      updateReport(report, progress.status)
    } else {
      const translationResult = await translateLessonOnCreate(
        lesson.lesson_id,
        {
          lesson_description: lesson.lesson_description,
          lesson_title: lesson.lesson_title,
          summary_content: lesson.summary_content,
          transcript_content: lesson.transcript_content,
        },
        context.userId
      )
      const progress = buildTranslationProgress({
        courseId,
        entityId: lesson.lesson_id,
        entityType: 'lesson',
        missingLanguages,
        title: lesson.lesson_title,
        translationResult,
      })
      context.details.push(progress)
      updateReport(report, progress.status)
    }
  } catch (error) {
    const progress = buildFailedProgress({
      courseId,
      entityId: lesson.lesson_id,
      entityType: 'lesson',
      error,
      title: lesson.lesson_title,
    })
    context.details.push(progress)
    updateReport(report, progress.status)
  }

  if (options.includeActivities) {
    await processLessonActivities(context, lesson)
  }

  if (options.includeMaterials) {
    await processLessonMaterials(context, lesson)
  }
}
