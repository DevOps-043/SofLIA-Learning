import { fromLoose } from '@/lib/supabase/looseQuery'
import { buildDeletionError, isMissingRelationError } from './errors'
import type { CourseHierarchyIds, SupabaseClient } from './types'

type TranslationEntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material'

export async function deleteWorkshopTranslations(
  supabase: SupabaseClient,
  workshopId: string,
  ids: CourseHierarchyIds,
) {
  await deleteContentTranslations(supabase, 'material', ids.materialIds)
  await deleteContentTranslations(supabase, 'activity', ids.activityIds)
  await deleteContentTranslations(supabase, 'lesson', ids.lessonIds)
  await deleteContentTranslations(supabase, 'module', ids.moduleIds)
  await deleteContentTranslations(supabase, 'course', [workshopId])
}

async function deleteContentTranslations(
  supabase: SupabaseClient,
  entityType: TranslationEntityType,
  entityIds: string[],
): Promise<void> {
  if (!entityIds.length) return

  const { error } = await fromLoose(supabase, 'content_translations')
    .delete()
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)

  if (!error || isMissingRelationError(error)) return

  throw buildDeletionError(`No se pudieron eliminar las traducciones de ${entityType}`, error)
}
