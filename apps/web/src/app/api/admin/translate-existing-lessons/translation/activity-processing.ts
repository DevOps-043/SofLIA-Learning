import { translateActivityOnCreate } from '@/core/services/courseTranslation.service'

import { computeMissingLanguages } from './languages'
import {
  buildFailedProgress,
  buildTranslatedProgress,
  buildTranslationProgress,
} from './progress'
import { ensureCourseReport, updateReport } from './reporting'
import type {
  ActivityTranslationRow,
  LessonTranslationRow,
  TranslationRunContext,
} from './types'

export async function processLessonActivities(
  context: TranslationRunContext,
  lesson: LessonTranslationRow
) {
  const courseId = lesson.course_modules.course_id
  const { data: activities } = await context.supabase
    .from('lesson_activities')
    .select('activity_id, activity_title, activity_description, activity_content, ai_prompts')
    .eq('lesson_id', lesson.lesson_id)

  for (const activity of (activities || []) as ActivityTranslationRow[]) {
    await processActivity(context, courseId, activity)
  }
}

async function processActivity(
  context: TranslationRunContext,
  courseId: string,
  activity: ActivityTranslationRow
) {
  const report = ensureCourseReport(context.reports, courseId)

  try {
    const { missingLanguages } = await computeMissingLanguages(
      context.supabase,
      'activity',
      activity.activity_id,
      [activity.activity_title, activity.activity_description || '']
    )

    if (missingLanguages.length === 0) {
      const progress = buildTranslatedProgress({
        courseId,
        entityId: activity.activity_id,
        entityType: 'activity',
        title: activity.activity_title,
      })
      context.details.push(progress)
      updateReport(report, progress.status)
      return
    }

    const translationResult = await translateActivityOnCreate(
      activity.activity_id,
      {
        activity_content: activity.activity_content,
        activity_description: activity.activity_description,
        activity_title: activity.activity_title,
        ai_prompts: activity.ai_prompts,
      },
      context.userId
    )

    const progress = buildTranslationProgress({
      courseId,
      entityId: activity.activity_id,
      entityType: 'activity',
      missingLanguages,
      title: activity.activity_title,
      translationResult,
    })
    context.details.push(progress)
    updateReport(report, progress.status)
  } catch (error) {
    const progress = buildFailedProgress({
      courseId,
      entityId: activity.activity_id,
      entityType: 'activity',
      error,
      title: activity.activity_title,
    })
    context.details.push(progress)
    updateReport(report, progress.status)
  }
}
