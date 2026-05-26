import { logger } from '../../../../lib/logger'
import { createAdminActivitiesClient } from './admin-activities.client'
import type { AdminActivity } from './admin-activities.types'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function getLessonActivities(lessonId: string): Promise<AdminActivity[]> {
  const supabase = await createAdminActivitiesClient()
  const { data, error } = await supabase
    .from('lesson_activities')
    .select(SELECT_COLUMNS.lesson_activities)
    .eq('lesson_id', lessonId)
    .order('activity_order_index', { ascending: true })

  if (error) {
    logger.error('Error fetching activities', { error: error.message, lessonId })
    throw error
  }

  return data || []
}

export async function getActivityById(activityId: string): Promise<AdminActivity | null> {
  const supabase = await createAdminActivitiesClient()

  try {
    const { data, error } = await supabase
      .from('lesson_activities')
      .select(SELECT_COLUMNS.lesson_activities)
      .eq('activity_id', activityId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Error fetching activity', {
      error: error instanceof Error ? error.message : String(error),
      activityId,
    })
    return null
  }
}
