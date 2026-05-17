import { createAdminModulesClient } from './admin-modules.client'
import type { AdminModule } from './admin-modules.types'

export async function getCourseModules(courseId: string): Promise<AdminModule[]> {
  const supabase = await createAdminModulesClient()
  const { data, error } = await supabase
    .from('course_modules')
    .select(`
      module_id,
      module_title,
      module_description,
      module_order_index,
      module_duration_minutes,
      is_required,
      is_published,
      course_id,
      created_at,
      updated_at
    `)
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getModuleById(moduleId: string): Promise<AdminModule | null> {
  const supabase = await createAdminModulesClient()

  try {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('module_id', moduleId)
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}
