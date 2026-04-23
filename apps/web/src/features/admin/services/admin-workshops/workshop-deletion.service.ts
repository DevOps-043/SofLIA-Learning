import { collectCourseHierarchyIds } from './workshop-deletion/collect-course-hierarchy-ids.service'
import { deleteWorkshopCourseRecords } from './workshop-deletion/delete-course-records.service'
import { deleteWorkshopForumRecords } from './workshop-deletion/delete-forum-records.service'
import { deleteWorkshopLiaRecords } from './workshop-deletion/delete-lia-records.service'
import { deleteWorkshopLessonRecords } from './workshop-deletion/delete-lesson-records.service'
import { deleteWorkshopModuleRecords } from './workshop-deletion/delete-module-records.service'
import { deleteWorkshopTeamRecords } from './workshop-deletion/delete-team-records.service'
import { deleteWorkshopTranslations } from './workshop-deletion/delete-translations.service'
import { WorkshopDeletionError } from './workshop-deletion/errors'
import type { SupabaseClient } from './workshop-deletion/types'

export { WorkshopDeletionError } from './workshop-deletion/errors'

// Deletion order is intentional: child records must be removed before parents
// to avoid FK constraint violations. The order is:
//   translations → lia records → lesson records → module records
//   → team records → forum records → course records (root)
//
// TODO(migration): Wrap these deletes in a PostgreSQL transaction via a
// Supabase RPC function (supabase/migrations/) to guarantee atomicity.
// Currently, a failure midway leaves the workshop in a partially-deleted state.
// Recovery requires re-running the deletion with the same workshopId.
const DELETION_STEPS = [
  { name: 'translations',    run: (s: SupabaseClient, id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopTranslations(s, id, ids) },
  { name: 'lia-records',     run: (s: SupabaseClient, _id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopLiaRecords(s, ids) },
  { name: 'lesson-records',  run: (s: SupabaseClient, _id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopLessonRecords(s, ids) },
  { name: 'module-records',  run: (s: SupabaseClient, _id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopModuleRecords(s, ids) },
  { name: 'team-records',    run: (s: SupabaseClient, id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopTeamRecords(s, id, ids) },
  { name: 'forum-records',   run: (s: SupabaseClient, id: string, ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopForumRecords(s, id, ids) },
  { name: 'course-records',  run: (s: SupabaseClient, id: string, _ids: Awaited<ReturnType<typeof collectCourseHierarchyIds>>) => deleteWorkshopCourseRecords(s, id) },
] as const

export async function deleteWorkshopHierarchy(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<void> {
  const ids = await collectCourseHierarchyIds(supabase, workshopId)

  const completedSteps: string[] = []

  for (const step of DELETION_STEPS) {
    try {
      await step.run(supabase, workshopId, ids)
      completedSteps.push(step.name)
    } catch (error) {
      // Log partial completion state for manual recovery
      console.error('[WorkshopDeletion] Step failed — partial deletion state', {
        workshopId,
        failedStep: step.name,
        completedSteps,
        pendingSteps: DELETION_STEPS.slice(completedSteps.length + 1).map(s => s.name),
      })

      const cause = error instanceof Error ? error : new Error(String(error))
      throw new WorkshopDeletionError(
        `La eliminacion del taller fallo en el paso "${step.name}" (workshopId: ${workshopId}). Pasos completados: [${completedSteps.join(', ')}]. Reintentar la operacion puede resolver el estado parcial.`,
        cause instanceof WorkshopDeletionError ? cause.statusCode : 500,
        { cause },
      )
    }
  }
}
