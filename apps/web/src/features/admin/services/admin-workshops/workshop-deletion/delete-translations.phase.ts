import { deleteContentTranslations } from './delete-content-translations'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopTranslations(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  await deleteContentTranslations(supabase, 'material', context.materialIds)
  await deleteContentTranslations(supabase, 'activity', context.activityIds)
  await deleteContentTranslations(supabase, 'lesson', context.lessonIds)
  await deleteContentTranslations(supabase, 'module', context.moduleIds)
  await deleteContentTranslations(supabase, 'course', [context.workshopId])
}
