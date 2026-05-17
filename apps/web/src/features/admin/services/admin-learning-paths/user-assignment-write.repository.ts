import type { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { AssignmentSource, UserLearningPathAssignmentRow } from './rows'
import { USER_ASSIGNMENT_SELECT } from './user-assignment-selects'

type AdminClient = ReturnType<typeof createAdminClient>

export async function reactivateUserAssignment(
  supabase: AdminClient,
  assignmentId: string,
  assignmentSource: AssignmentSource,
  defaultRuleId: string | null,
) {
  const result = await fromLoose<UserLearningPathAssignmentRow>(supabase, 'user_learning_path_assignments')
    .update({
      status: 'assigned',
      assignment_source: assignmentSource,
      default_rule_id: defaultRuleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)

  if (result.error) {
    logger.error('Error reactivating user learning path assignment:', result.error)
    throw new Error('No se pudo reactivar la asignacion del learning path')
  }
}

export async function createUserAssignment(
  supabase: AdminClient,
  organizationId: string,
  userId: string,
  learningPathId: string,
  adminUserId: string | null,
  assignmentSource: AssignmentSource,
  defaultRuleId: string | null,
) {
  const { data, error } = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .insert({
      organization_id: organizationId,
      user_id: userId,
      learning_path_id: learningPathId,
      assigned_by: adminUserId,
      status: 'assigned',
      assignment_source: assignmentSource,
      default_rule_id: defaultRuleId,
    })
    .select(USER_ASSIGNMENT_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error assigning learning path to user:', error)
    throw new Error('No se pudo asignar el learning path al usuario')
  }

  return data
}

export async function revokeUserAssignment(
  supabase: AdminClient,
  organizationId: string,
  assignmentId: string,
) {
  const { error } = await fromLoose<UserLearningPathAssignmentRow>(supabase, 'user_learning_path_assignments')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', assignmentId)

  if (error) {
    logger.error('Error revoking user learning path assignment:', error)
    throw new Error('No se pudo revocar la asignacion individual')
  }
}
