import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { createAdminSupabase } from './admin-client'
import { buildActivityRows, buildMaterialRows } from './lesson-rows'
import type { CourseEngineActivity, CourseEngineMaterial } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>

export async function replaceLessonMaterials(
  supabase: AdminSupabaseClient,
  lessonId: string,
  materials: CourseEngineMaterial[],
): Promise<void> {
  await supabase.from('lesson_materials').delete().eq('lesson_id', lessonId)
  if (materials.length === 0) return

  const { error } = await supabase.from('lesson_materials').insert(buildMaterialRows({ lessonId, materials }))
  if (error) throw new Error(`Materials insert failed: ${error.message}`)
}

export async function replaceLessonActivities(
  supabase: AdminSupabaseClient,
  lessonId: string,
  activities: CourseEngineActivity[],
): Promise<void> {
  await supabase.from('lesson_activities').delete().eq('lesson_id', lessonId)
  if (activities.length === 0) return

  const { error } = await supabase.from('lesson_activities').insert(buildActivityRows({ lessonId, activities }))
  if (error) throw new Error(`Activities insert failed: ${error.message}`)
}

export async function cleanupObsoleteLessons(
  supabase: AdminSupabaseClient,
  validModuleIds: string[],
  validLessonIds: string[],
): Promise<void> {
  if (validModuleIds.length === 0) return

  let query = supabase.from('course_lessons').delete().in('module_id', validModuleIds)
  if (validLessonIds.length > 0) {
    query = query.not('lesson_id', 'in', `(${validLessonIds.join(',')})`)
  }
  const { error } = await query
  if (error) techDebtLogger.error(`Failed to cleanup obsolete lessons: ${error.message}`)
}

export async function cleanupObsoleteModules(
  supabase: AdminSupabaseClient,
  courseId: string,
  validModuleIds: string[],
): Promise<void> {
  let query = supabase.from('course_modules').delete().eq('course_id', courseId)
  if (validModuleIds.length > 0) {
    query = query.not('module_id', 'in', `(${validModuleIds.join(',')})`)
  }
  const { error } = await query
  if (error) techDebtLogger.error(`Failed to cleanup obsolete modules: ${error.message}`)
}
