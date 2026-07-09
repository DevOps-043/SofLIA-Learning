import { createAdminClient } from '@/lib/supabase/admin'
import type { UserLearningPathAssignment } from '../../types'
import { mapUserAssignment } from './assignment-mappers'
import type { CourseAccessCleanupResult } from './course-access-provenance-cleanup.service'
import { revokeCourseAccessSourcedFromLearningPath } from './course-access-provenance-cleanup.service'
import { listLearningPaths } from './learning-paths.query'
import {
  findUserAssignmentById,
  listRawUserAssignments,
} from './user-assignment-read.repository'
import { revokeUserAssignment } from './user-assignment-write.repository'

export async function listUserAssignments(
  organizationId: string,
): Promise<UserLearningPathAssignment[]> {
  const supabase = createAdminClient()
  const rows = await listRawUserAssignments(supabase, organizationId)
  const learningPaths = await listLearningPaths()
  const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))

  return rows.map((row) =>
    mapUserAssignment(row, learningPathMap.get(row.learning_path_id) || null),
  )
}

export function revokeFromUser(
  organizationId: string,
  assignmentId: string,
) {
  const supabase = createAdminClient()
  return revokeUserAssignment(supabase, organizationId, assignmentId)
}

/**
 * Revokes a user's learning-path assignment and cleans up the individual
 * course access it materialized: courses with zero progress are auto-revoked,
 * courses with real progress are kept and reported back so the caller can
 * let an admin decide explicitly whether to also revoke those.
 */
export async function revokeFromUserWithCourseCleanup(
  organizationId: string,
  assignmentId: string,
): Promise<CourseAccessCleanupResult> {
  const supabase = createAdminClient()
  const assignment = await findUserAssignmentById(supabase, organizationId, assignmentId)

  if (!assignment) {
    throw new Error('La asignacion no existe o ya fue revocada en esta organizacion')
  }

  await revokeUserAssignment(supabase, organizationId, assignmentId)

  return revokeCourseAccessSourcedFromLearningPath({
    learningPathId: assignment.learning_path_id,
    userId: assignment.user_id,
    organizationId,
  })
}
