import { fromLoose } from '@/lib/supabase/looseQuery'
import { executeDelete } from './delete-helpers'
import type { SupabaseClient } from './types'

type TranslatableEntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material'

export async function deleteContentTranslations(
  supabase: SupabaseClient,
  entityType: TranslatableEntityType,
  entityIds: string[],
): Promise<void> {
  if (!entityIds.length) return
  await executeDelete(
    'las traducciones de ' + entityType,
    fromLoose(supabase, 'content_translations')
      .delete()
      .eq('entity_type', entityType)
      .in('entity_id', entityIds),
    { ignoreMissingRelation: true },
  )
}
