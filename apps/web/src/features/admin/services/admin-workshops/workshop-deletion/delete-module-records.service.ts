import { runDeleteInPlans } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteWorkshopModuleRecords(
  supabase: SupabaseClient,
  ids: CourseHierarchyIds,
) {
  await runDeleteInPlans(supabase, [
    { tableName: 'lia_conversations', column: 'module_id', values: ids.moduleIds, label: 'las conversaciones IA asociadas a modulos del taller' },
    { tableName: 'user_module_progress', column: 'module_id', values: ids.moduleIds, label: 'el progreso de modulos del taller' },
    { tableName: 'course_modules', column: 'module_id', values: ids.moduleIds, label: 'los modulos del taller', required: true },
  ])
}
