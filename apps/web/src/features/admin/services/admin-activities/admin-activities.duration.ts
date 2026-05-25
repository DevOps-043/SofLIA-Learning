import { logger } from '../../../../lib/logger'
import { createAdminActivitiesClient } from './admin-activities.client'

function sumEstimatedMinutes(rows: Array<{ estimated_time_minutes?: number | null }> | null) {
  return rows?.reduce((sum, row) => sum + (row.estimated_time_minutes || 0), 0) || 0
}

export async function updateModuleDurationFromLesson(lessonId: string): Promise<void> {
  const supabase = await createAdminActivitiesClient()

  try {
    await recalculateLessonDuration(lessonId)

    const { data: lesson } = await supabase
      .from('course_lessons')
      .select('module_id')
      .eq('lesson_id', lessonId)
      .single()
    const lessonData = lesson as { module_id: string } | null

    if (lessonData?.module_id) {
      const { AdminLessonsService } = await import('../adminLessons.service')
      await AdminLessonsService.updateModuleDuration(lessonData.module_id)
    }
  } catch (error) {
    logger.error('Error updating module duration from lesson', {
      error: error instanceof Error ? error.message : String(error),
      lessonId,
    })
  }
}

export async function recalculateLessonDuration(lessonId: string): Promise<void> {
  const supabase = await createAdminActivitiesClient()

  try {
    const [{ data: lesson }, { data: materials }, { data: activities }] = await Promise.all([
      supabase.from('course_lessons').select('duration_seconds').eq('lesson_id', lessonId).single(),
      supabase.from('lesson_materials').select('estimated_time_minutes').eq('lesson_id', lessonId),
      supabase.from('lesson_activities').select('estimated_time_minutes').eq('lesson_id', lessonId),
    ])
    const lessonRow = lesson as { duration_seconds: number } | null
    const totalDurationMinutes =
      Math.round((lessonRow?.duration_seconds || 0) / 60) +
      sumEstimatedMinutes(materials) +
      sumEstimatedMinutes(activities)

    await supabase
      .from('course_lessons')
      .update({ total_duration_minutes: totalDurationMinutes, updated_at: new Date().toISOString() })
      .eq('lesson_id', lessonId)

    logger.debug('Lesson duration recalculated', { lessonId, totalDurationMinutes })
  } catch (error) {
    logger.error('Error recalculating lesson duration', {
      error: error instanceof Error ? error.message : String(error),
      lessonId,
    })
  }
}
