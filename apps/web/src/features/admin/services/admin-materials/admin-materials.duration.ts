import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminMaterialsClient } from './admin-materials.client'

function sumEstimatedMinutes(rows: Array<{ estimated_time_minutes?: number | null }> | null) {
  return rows?.reduce((sum, row) => sum + (row.estimated_time_minutes || 0), 0) || 0
}

export async function updateModuleDurationFromLesson(lessonId: string): Promise<void> {
  const supabase = await createAdminMaterialsClient()

  try {
    await recalculateLessonDuration(lessonId)

    const { data: lesson } = await supabase
      .from('course_lessons')
      .select('module_id')
      .eq('lesson_id', lessonId)
      .single()
    const lessonRow = lesson as { module_id?: string } | null

    if (lessonRow?.module_id) {
      const { AdminLessonsService } = await import('../adminLessons.service')
      await AdminLessonsService.updateModuleDuration(lessonRow.module_id)
    }
  } catch (error) {
    techDebtLogger.error('Error updating module duration from lesson:', error)
  }
}

export async function recalculateLessonDuration(lessonId: string): Promise<void> {
  const supabase = await createAdminMaterialsClient()

  try {
    const [{ data: lesson }, { data: materials }, { data: activities }] = await Promise.all([
      supabase.from('course_lessons').select('duration_seconds').eq('lesson_id', lessonId).single(),
      supabase.from('lesson_materials').select('estimated_time_minutes').eq('lesson_id', lessonId),
      supabase.from('lesson_activities').select('estimated_time_minutes').eq('lesson_id', lessonId),
    ])
    const lessonForDuration = lesson as { duration_seconds?: number } | null
    const totalDurationMinutes =
      Math.round((lessonForDuration?.duration_seconds || 0) / 60) +
      sumEstimatedMinutes(materials) +
      sumEstimatedMinutes(activities)

    await supabase
      .from('course_lessons')
      .update({ total_duration_minutes: totalDurationMinutes, updated_at: new Date().toISOString() })
      .eq('lesson_id', lessonId)
  } catch (error) {
    techDebtLogger.error('Error recalculating lesson duration:', error)
  }
}
