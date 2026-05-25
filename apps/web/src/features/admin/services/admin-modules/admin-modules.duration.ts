import { createAdminModulesClient } from './admin-modules.client'

function sumEstimatedMinutes(rows: Array<{ estimated_time_minutes?: number | null }> | null) {
  return rows?.reduce((sum, row) => sum + (row.estimated_time_minutes || 0), 0) || 0
}

export async function calculateModuleDuration(moduleId: string): Promise<number> {
  const supabase = await createAdminModulesClient()
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, duration_seconds')
    .eq('module_id', moduleId)

  if (error) throw error

  const totalVideoSeconds = lessons?.reduce(
    (sum, lesson) => sum + (lesson.duration_seconds || 0),
    0,
  ) || 0
  const lessonIds = lessons?.map((lesson) => lesson.lesson_id) || []
  let materialsMinutes = 0
  let activitiesMinutes = 0

  if (lessonIds.length > 0) {
    const [{ data: materials }, { data: activities }] = await Promise.all([
      supabase
        .from('lesson_materials')
        .select('estimated_time_minutes')
        .in('lesson_id', lessonIds),
      supabase
        .from('lesson_activities')
        .select('estimated_time_minutes')
        .in('lesson_id', lessonIds),
    ])

    materialsMinutes = sumEstimatedMinutes(materials)
    activitiesMinutes = sumEstimatedMinutes(activities)
  }

  const totalMinutes = Math.round(totalVideoSeconds / 60) + materialsMinutes + activitiesMinutes
  await supabase
    .from('course_modules')
    .update({ module_duration_minutes: totalMinutes })
    .eq('module_id', moduleId)

  return totalMinutes
}
