import { deleteByInBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopModuleData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  await deleteByInBatch(supabase, [
    { table: 'lia_conversations', column: 'module_id', values: context.moduleIds, label: 'las conversaciones IA asociadas a modulos del taller', optional: true },
    { table: 'user_module_progress', column: 'module_id', values: context.moduleIds, label: 'el progreso de modulos del taller', optional: true, ignoreMissingRelation: true },
    { table: 'course_modules', column: 'module_id', values: context.moduleIds, label: 'los modulos del taller' },
  ])
}
