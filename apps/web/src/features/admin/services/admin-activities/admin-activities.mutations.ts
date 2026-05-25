import { logger } from '../../../../lib/logger'
import { createAdminActivitiesClient } from './admin-activities.client'
import { updateModuleDurationFromLesson } from './admin-activities.duration'
import type { AdminActivity, UpdateActivityData } from './admin-activities.types'

export async function updateActivity(
  activityId: string,
  activityData: UpdateActivityData,
): Promise<AdminActivity> {
  const supabase = await createAdminActivitiesClient()
  const { data, error } = await supabase
    .from('lesson_activities')
    .update(activityData)
    .eq('activity_id', activityId)
    .select()
    .single()

  if (error) throw error
  if (activityData.estimated_time_minutes !== undefined) {
    await updateModuleDurationFromLesson(data.lesson_id)
  }
  return data
}

export async function deleteActivity(activityId: string): Promise<void> {
  const supabase = await createAdminActivitiesClient()
  const { data: activity } = await supabase
    .from('lesson_activities')
    .select('lesson_id')
    .eq('activity_id', activityId)
    .single()
  const lessonId = (activity as { lesson_id: string } | null)?.lesson_id
  const { error } = await supabase.from('lesson_activities').delete().eq('activity_id', activityId)

  if (error) throw error
  if (lessonId) await updateModuleDurationFromLesson(lessonId)
}

export async function reorderActivities(
  lessonId: string,
  activities: Array<{ activity_id: string; activity_order_index: number }>,
): Promise<void> {
  const supabase = await createAdminActivitiesClient()
  const results = await Promise.all(
    activities.map((activity) =>
      supabase
        .from('lesson_activities')
        .update({ activity_order_index: activity.activity_order_index })
        .eq('activity_id', activity.activity_id),
    ),
  )

  if (results.some((result) => result.error)) {
    logger.error('Error reordering activities', { errorCount: results.length, lessonId })
    throw new Error('Error al reordenar actividades')
  }
}
