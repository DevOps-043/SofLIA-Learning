import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { CourseAccessCleanupResult } from './course-access-provenance-cleanup.service'
import { revokeCourseAccessSourcedFromLearningPath } from './course-access-provenance-cleanup.service'
import type { LearningPathRow } from './rows'

export async function deleteLearningPath(id: string) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Error deleting learning path:', error)
    throw new Error('No se pudo eliminar el learning path')
  }
}

/**
 * Deletes a learning path and, before doing so, cleans up the individual
 * course access it materialized org-wide: courses with zero progress are
 * auto-revoked, courses with real progress are kept (their provenance link
 * is cleared to NULL by the FK's ON DELETE SET NULL once the path is gone)
 * and reported back so the caller can summarize what happened.
 */
export async function deleteLearningPathWithCourseCleanup(
  id: string,
): Promise<CourseAccessCleanupResult> {
  const cleanup = await revokeCourseAccessSourcedFromLearningPath({ learningPathId: id })
  await deleteLearningPath(id)
  return cleanup
}
