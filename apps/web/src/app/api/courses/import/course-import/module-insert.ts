import type { ImportedModule, ServiceSupabaseClient } from './types'

export async function insertImportedModule(
  supabase: ServiceSupabaseClient,
  courseId: string,
  moduleData: ImportedModule,
) {
  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      module_title: moduleData.title,
      module_description: moduleData.description,
      module_order_index: moduleData.order_index + 1,
      is_published: false,
      module_duration_minutes: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as { module_id: string }
}
