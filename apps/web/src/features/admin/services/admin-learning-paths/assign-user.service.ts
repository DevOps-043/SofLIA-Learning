import 'server-only'

import { logger } from '@/lib/utils/logger'
import type { UserLearningPathAssignment } from '../../types'
import type { UserLearningPathAssignmentRow } from './assignment-row.types'
import {
  findUserLearningPathAssignment,
  insertUserLearningPathAssignment,
  reactivateUserLearningPathAssignment,
} from './assign-user-records.service'
import { syncCourseAccessForOrganization } from './organization-course-access.service'
import { getLearningPathById } from './read-learning-paths.service'
import { syncCourseAccessForUser } from './user-course-access.service'

function mapUserAssignment(
  row: UserLearningPathAssignmentRow,
  learningPath: UserLearningPathAssignment['learning_path'],
): UserLearningPathAssignment {
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    learning_path_id: row.learning_path_id,
    assigned_at: row.assigned_at,
    status: row.status,
    learning_path: learningPath,
    user: row.users || null,
  }
}

// KNOWN LIMITATION: This operation is not atomic.
// Steps: (1) sync org course access → (2) sync user course access → (3) upsert assignment record.
// If step 3 fails after steps 1–2 succeed, course access is granted without an assignment record
// (orphan access). Re-running the operation with the same arguments will self-heal,
// since steps 1–2 are idempotent and step 3 will succeed on retry.
//
// TODO(migration): Move this logic to a PostgreSQL RPC function
// (supabase/migrations/) to guarantee atomicity across all three steps.
export async function assignLearningPathToUser(
  organizationId: string,
  userId: string,
  learningPathId: string,
  adminUserId: string,
): Promise<UserLearningPathAssignment> {
  const path = await getLearningPathById(learningPathId)
  if (!path) {
    throw new Error('Learning path no encontrado')
  }

  const courseIds = path.items.map((item) => item.course_id)

  // Check for an existing assignment before running the sync operations.
  // If the assignment is already active, we skip unnecessary syncs.
  const existing = await findUserLearningPathAssignment(organizationId, userId, learningPathId)
  if (existing.error) {
    logger.error('Error checking user learning path assignment:', existing.error)
    throw new Error('No se pudo verificar la asignacion existente del learning path')
  }

  if (existing.data?.status === 'assigned') {
    return mapUserAssignment(existing.data, path)
  }

  // Sync course access before creating or reactivating the assignment record.
  // Errors here are fatal: we must not create an assignment without access being granted.
  await syncCourseAccessForOrganization(organizationId, courseIds, adminUserId)
  await syncCourseAccessForUser(organizationId, userId, courseIds, adminUserId)

  if (existing.data) {
    await reactivateUserLearningPathAssignment(existing.data.id)
    return mapUserAssignment({ ...existing.data, status: 'assigned' }, path)
  }

  const { data, error } = await insertUserLearningPathAssignment(
    organizationId,
    userId,
    learningPathId,
    adminUserId,
  )

  if (error || !data) {
    // Course access was already synced at this point — log for manual remediation.
    console.error('[AssignLearningPath] Assignment record insert failed after access sync', {
      organizationId,
      userId,
      learningPathId,
      courseIds,
      error,
    })
    logger.error('Error assigning learning path to user:', error)
    throw new Error('No se pudo crear el registro de asignacion del learning path')
  }

  return mapUserAssignment(data, path)
}
