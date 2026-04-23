import { pickPublishedOrAll } from './published-items'
import type { ModuleRow, SupabaseServerClient } from './types'

export async function loadCourseModules(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  const { data, error } = await supabase
    .from('course_modules')
    .select('module_id, module_title, module_order_index, module_duration_minutes, is_published, module_description')
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: true })

  if (error || !data) return null
  return pickPublishedOrAll(data as ModuleRow[])
}
