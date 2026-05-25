import { collectCourseHierarchyIds } from './workshop-deletion/collect-course-hierarchy'
import { deleteAiWorkshopData } from './workshop-deletion/delete-ai-data'
import { deleteByEq, deleteByIn, deleteContentTranslations } from './workshop-deletion/delete-helpers'
import { deleteCourseRelatedData } from './workshop-deletion/delete-course-data'
import { deleteLessonData } from './workshop-deletion/delete-lesson-data'
import { deleteModuleData } from './workshop-deletion/delete-module-data'
import { deleteTeamData } from './workshop-deletion/delete-team-data'
import { WorkshopDeletionError } from './workshop-deletion/errors'
import type { SupabaseClient } from './workshop-deletion/types'

export { WorkshopDeletionError }

export async function deleteWorkshopHierarchy(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<void> {
  const hierarchy = await collectCourseHierarchyIds(supabase, workshopId)

  await deleteContentTranslations(supabase, 'material', hierarchy.materialIds)
  await deleteContentTranslations(supabase, 'activity', hierarchy.activityIds)
  await deleteContentTranslations(supabase, 'lesson', hierarchy.lessonIds)
  await deleteContentTranslations(supabase, 'module', hierarchy.moduleIds)
  await deleteContentTranslations(supabase, 'course', [workshopId])

  await deleteByIn(supabase, 'certificate_ledger', 'cert_id', hierarchy.certificateIds, {
    label: 'el historial de certificados del taller',
    ignoreMissingRelation: true,
  })

  await deleteAiWorkshopData(supabase, hierarchy)
  await deleteLessonData(supabase, hierarchy.lessonIds)
  await deleteModuleData(supabase, hierarchy.moduleIds)
  await deleteTeamData(supabase, hierarchy.teamIds, workshopId)
  await deleteCourseRelatedData(supabase, workshopId, hierarchy)
  await deleteByEq(supabase, 'courses', 'id', workshopId, { label: 'el taller' })
}
