import { logger } from '../../../../lib/logger'
import { enqueueActivityReadingAudio } from '@/core/services/tts/server/tts-reading-pregeneration.service'
import type { TablesInsert } from '@/lib/supabase/types'
import { createAdminActivitiesClient } from './admin-activities.client'
import { updateModuleDurationFromLesson } from './admin-activities.duration'
import type { AdminActivity, CreateActivityData } from './admin-activities.types'

async function getNextActivityOrderIndex(lessonId: string) {
  const supabase = await createAdminActivitiesClient()
  const { count } = await supabase
    .from('lesson_activities')
    .select('activity_id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  return (count || 0) + 1
}

async function translateCreatedActivity(activity: AdminActivity, userId?: string) {
  try {
    const { translateActivityOnCreate } = await import('@/core/services/courseTranslation.service')
    await translateActivityOnCreate(
      activity.activity_id,
      {
        activity_title: activity.activity_title,
        activity_description: activity.activity_description,
        activity_content: activity.activity_content,
        ai_prompts: activity.ai_prompts,
      },
      userId,
    )
  } catch (translationError) {
    logger.error('Error en traducción automática de la actividad', {
      error: translationError instanceof Error ? translationError.message : String(translationError),
      activityId: activity.activity_id,
    })
  }
}

export async function createActivity(
  lessonId: string,
  activityData: CreateActivityData,
  userId?: string,
): Promise<AdminActivity> {
  const supabase = await createAdminActivitiesClient()
  const insertData: TablesInsert<'lesson_activities'> = {
    lesson_id: lessonId,
    ...activityData,
    activity_config: activityData.activity_config ?? null,
    activity_schema_version: activityData.activity_schema_version ?? 1,
    activity_order_index: await getNextActivityOrderIndex(lessonId),
    external_tool_key: activityData.external_tool_key ?? null,
    is_required: activityData.is_required ?? false,
    estimated_time_minutes: activityData.estimated_time_minutes || 5,
    requires_soflia_validation: activityData.requires_soflia_validation ?? false,
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('lesson_activities')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  const createdActivity = data as AdminActivity
  await translateCreatedActivity(createdActivity, userId)
  await updateModuleDurationFromLesson(lessonId)
  // Pre-generación de audio de lectura (best-effort).
  await enqueueActivityReadingAudio(createdActivity)
  return createdActivity
}
