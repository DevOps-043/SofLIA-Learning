import type { createAdminClient } from '@/lib/supabase/admin'
import type { LearningPath, UserLearningPathAssignment } from '../../types'
import { mapUserAssignment } from './assignment-mappers'
import { reactivateUserAssignment } from './user-assignment-write.repository'
import type {
  AssignmentSource,
  UserLearningPathAssignmentRow,
} from './rows'

type AdminClient = ReturnType<typeof createAdminClient>

interface HandleExistingUserAssignmentArgs {
  assignmentSource: AssignmentSource
  defaultRuleId: string | null
  existing: UserLearningPathAssignmentRow | null
  learningPath: LearningPath
  reactivateRevoked: boolean
  supabase: AdminClient
}

export async function handleExistingUserAssignment({
  assignmentSource,
  defaultRuleId,
  existing,
  learningPath,
  reactivateRevoked,
  supabase,
}: HandleExistingUserAssignmentArgs): Promise<UserLearningPathAssignment | null> {
  if (!existing) return null

  if (existing.status === 'revoked' && !reactivateRevoked) {
    return mapUserAssignment(existing, learningPath, { status: 'revoked' })
  }

  if (existing.status !== 'assigned') {
    await reactivateUserAssignment(supabase, existing.id, assignmentSource, defaultRuleId)
  }

  const nextAssignmentSource = existing.status === 'assigned'
    ? existing.assignment_source
    : assignmentSource
  const nextDefaultRuleId = existing.status === 'assigned'
    ? existing.default_rule_id
    : defaultRuleId

  return mapUserAssignment(existing, learningPath, {
    status: 'assigned',
    assignmentSource: nextAssignmentSource,
    defaultRuleId: nextDefaultRuleId,
  })
}
