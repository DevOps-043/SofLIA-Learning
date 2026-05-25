import { deleteByIn, deleteOptionalByIn } from './delete-helpers'
import type { SupabaseClient } from './types'

export async function deleteModuleData(supabase: SupabaseClient, moduleIds: string[]) {
  await deleteOptionalByIn(supabase, 'lia_conversations', 'module_id', moduleIds, {
    label: 'las conversaciones IA asociadas a modulos del taller',
  })
  await deleteOptionalByIn(supabase, 'user_module_progress', 'module_id', moduleIds, {
    label: 'el progreso de modulos del taller',
    ignoreMissingRelation: true,
  })
  await deleteByIn(supabase, 'course_modules', 'module_id', moduleIds, {
    label: 'los modulos del taller',
  })
}
