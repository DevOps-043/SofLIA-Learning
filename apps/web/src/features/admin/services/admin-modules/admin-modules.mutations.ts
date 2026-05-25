import { createAdminModulesClient } from './admin-modules.client'
import type { AdminModule, UpdateModuleData } from './admin-modules.types'

export async function updateModule(
  moduleId: string,
  moduleData: UpdateModuleData,
): Promise<AdminModule> {
  const supabase = await createAdminModulesClient()
  const { data, error } = await supabase
    .from('course_modules')
    .update({ ...moduleData, updated_at: new Date().toISOString() })
    .eq('module_id', moduleId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteModule(moduleId: string): Promise<void> {
  const supabase = await createAdminModulesClient()
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .eq('module_id', moduleId)

  if (lessonsError) throw lessonsError

  if (lessons && lessons.length > 0) {
    const { deleteLesson } = await import('./../admin-lessons/mutation.service')
    for (const lesson of lessons) {
      await deleteLesson(lesson.lesson_id)
    }
  }

  await Promise.all([
    supabase.from('lia_conversations').delete().eq('module_id', moduleId),
    supabase
      .from('content_translations')
      .delete()
      .eq('entity_type', 'module')
      .eq('entity_id', moduleId),
  ])

  const { error } = await supabase.from('course_modules').delete().eq('module_id', moduleId)
  if (error) throw error
}

export async function reorderModules(
  _courseId: string,
  modules: Array<{ module_id: string; module_order_index: number }>,
): Promise<void> {
  const supabase = await createAdminModulesClient()
  const results = await Promise.all(
    modules.map((module) =>
      supabase
        .from('course_modules')
        .update({ module_order_index: module.module_order_index, updated_at: new Date().toISOString() })
        .eq('module_id', module.module_id),
    ),
  )

  if (results.some((result) => result.error)) {
    throw new Error('Error al reordenar módulos')
  }
}

export async function toggleModulePublished(moduleId: string): Promise<AdminModule> {
  const supabase = await createAdminModulesClient()
  const { data: currentModule } = await supabase
    .from('course_modules')
    .select('is_published')
    .eq('module_id', moduleId)
    .single()

  if (!currentModule) throw new Error('Módulo no encontrado')

  const { data, error } = await supabase
    .from('course_modules')
    .update({ is_published: !currentModule.is_published, updated_at: new Date().toISOString() })
    .eq('module_id', moduleId)
    .select()
    .single()

  if (error) throw error
  return data
}
