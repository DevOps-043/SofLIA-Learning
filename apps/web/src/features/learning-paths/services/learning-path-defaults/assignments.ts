import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { createEmptyBulkApplyResult } from './results'
import { resolveTargetUserIds } from './target-users'
import type { LearningPathAssignmentSource, LearningPathBulkApplyResult, LearningPathTarget, UserLearningPathAssignmentStatusRow } from './types'

async function getExistingAssignmentStatus(organizationId: string, userId: string, learningPathId: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<UserLearningPathAssignmentStatusRow>(supabase, 'user_learning_path_assignments')
    .select('id, status')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()

  if (error) {
    logger.error('Error checking learning path assignment status:', error)
    throw new Error('No se pudo validar la asignacion existente')
  }
  return data
}

export async function assignLearningPathToUsers(params: {
  organizationId: string
  learningPathId: string
  userIds: string[]
  assignedBy: string | null
  assignmentSource: LearningPathAssignmentSource
  defaultRuleId?: string | null
  reactivateRevoked?: boolean
}): Promise<LearningPathBulkApplyResult> {
  const uniqueUserIds = [...new Set(params.userIds)]
  const result = createEmptyBulkApplyResult(uniqueUserIds.length)

  for (const userId of uniqueUserIds) {
    await assignLearningPathToSingleUser(params, userId, result)
  }
  return result
}

export async function assignLearningPathToTarget(params: {
  organizationId: string
  learningPathId: string
  target: LearningPathTarget
  assignedBy: string
}) {
  const userIds = await resolveTargetUserIds(params.organizationId, params.target)
  return assignLearningPathToUsers({ ...params, userIds, assignmentSource: 'bulk', reactivateRevoked: true })
}

async function assignLearningPathToSingleUser(
  params: Parameters<typeof assignLearningPathToUsers>[0],
  userId: string,
  result: LearningPathBulkApplyResult,
) {
  const existing = await getExistingAssignmentStatus(params.organizationId, userId, params.learningPathId)
  if (existing?.status === 'assigned') { result.existing += 1; return }
  if (existing?.status === 'revoked' && params.reactivateRevoked === false) { result.skippedRevoked += 1; return }

  const assignment = await AdminLearningPathsService.assignToUser(
    params.organizationId,
    userId,
    params.learningPathId,
    params.assignedBy || userId,
    { assignmentSource: params.assignmentSource, defaultRuleId: params.defaultRuleId, reactivateRevoked: params.reactivateRevoked },
  )

  if (assignment.status === 'assigned' && existing?.status === 'revoked') result.reactivated += 1
  else if (assignment.status === 'assigned') result.assigned += 1
}
