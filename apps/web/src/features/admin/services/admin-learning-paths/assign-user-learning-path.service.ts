import { createAdminClient } from '@/lib/supabase/admin'
import type { UserLearningPathAssignment } from '../../types'
import { mapUserAssignment } from './assignment-mappers'
import { handleExistingUserAssignment } from './existing-user-assignment.service'
import { getLearningPathById } from './learning-paths.query'
import { syncCourseAccessForOrganization } from './organization-course-access.service'
import type { AssignmentSource } from './rows'
import { notifyUserPathAssigned } from './user-assignment-notifications.service'
import { findUserAssignment } from './user-assignment-read.repository'
import { createUserAssignment } from './user-assignment-write.repository'
import { syncCourseAccessForUser } from './user-course-access.service'

export interface AssignToUserOptions {
  assignmentSource?: AssignmentSource
  defaultRuleId?: string | null
  reactivateRevoked?: boolean
}

export async function assignToUser(
  organizationId: string,
  userId: string,
  learningPathId: string,
  adminUserId: string | null,
  options: AssignToUserOptions = {},
): Promise<UserLearningPathAssignment> {
  const path = await getLearningPathById(learningPathId)
  if (!path) throw new Error('Learning path no encontrado')

  const courseIds = path.items.map((item) => item.course_id)
  await syncCourseAccessForOrganization(organizationId, courseIds, adminUserId)
  await syncCourseAccessForUser(organizationId, userId, courseIds, adminUserId)

  const supabase = createAdminClient()
  const assignmentSource = options.assignmentSource || 'manual'
  const defaultRuleId = options.defaultRuleId || null
  const reactivateRevoked = options.reactivateRevoked ?? true
  const existing = await findUserAssignment(
    supabase,
    organizationId,
    userId,
    learningPathId,
  )
  const handledExisting = await handleExistingUserAssignment({
    assignmentSource,
    defaultRuleId,
    existing,
    learningPath: path,
    reactivateRevoked,
    supabase,
  })

  if (handledExisting) return handledExisting

  const created = await createUserAssignment(
    supabase,
    organizationId,
    userId,
    learningPathId,
    adminUserId,
    assignmentSource,
    defaultRuleId,
  )
  await notifyUserPathAssigned(userId, organizationId, learningPathId, path.title)

  return mapUserAssignment(created, path)
}
