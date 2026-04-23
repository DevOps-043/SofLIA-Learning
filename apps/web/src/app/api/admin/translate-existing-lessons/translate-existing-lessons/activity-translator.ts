import { translateActivityOnCreate } from '@/core/services/courseTranslation.service'
import { computeMissingLanguages } from './missing-languages'
import {
  createAlreadyTranslatedProgress,
  createFailedProgress,
  createTranslationProgress,
} from './entity-progress'
import type { ActivityRow, EntityProgress, TranslationSupabaseClient } from './types'

export async function translateLessonActivities(
  supabase: TranslationSupabaseClient,
  lessonId: string,
  courseId: string,
  userId: string,
): Promise<EntityProgress[]> {
  const { data } = await supabase
    .from('lesson_activities')
    .select('activity_id, activity_title, activity_description, activity_content, ai_prompts')
    .eq('lesson_id', lessonId)

  const progress: EntityProgress[] = []
  for (const activity of (data || []) as ActivityRow[]) {
    progress.push(await translateActivityEntity(supabase, activity, courseId, userId))
  }
  return progress
}

async function translateActivityEntity(
  supabase: TranslationSupabaseClient,
  activity: ActivityRow,
  courseId: string,
  userId: string,
): Promise<EntityProgress> {
  const identity = {
    entityType: 'activity' as const,
    entityId: activity.activity_id,
    title: activity.activity_title,
    courseId,
  }

  try {
    const { missingLanguages } = await computeMissingLanguages(
      supabase,
      'activity',
      activity.activity_id,
      [activity.activity_title, activity.activity_description || ''],
    )
    if (missingLanguages.length === 0) return createAlreadyTranslatedProgress(identity)

    const translationResult = await translateActivityOnCreate(
      activity.activity_id,
      {
        activity_title: activity.activity_title,
        activity_description: activity.activity_description,
        activity_content: activity.activity_content,
        ai_prompts: activity.ai_prompts,
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
