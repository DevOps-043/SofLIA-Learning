import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { UserLearningPathAssignmentRow } from './assignment-row.types'
import { USER_ASSIGNMENT_WITH_USER_SELECT } from './selects'

export async function findUserLearningPathAssignment(
  organizationId: string,
  userId: string,
  learningPathId: string,
) {
  const supabase = createAdminClient()
  return fromLoose<UserLearningPathAssignmentRow>(supabase, 'user_learning_path_assignments')
    .select(USER_ASSIGNMENT_WITH_USER_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()
}

export async function reactivateUserLearningPathAssignment(id: string) {
  const supabase = createAdminClient()
  const result = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .update({ status: 'assigned', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (result.error) {
    logger.error('Error reactivating user learning path assignment:', result.error)
    throw new Error('No se pudo reactivar la asignacion del learning path')
  }
}

export async function insertUserLearningPathAssignment(
  organizationId: string,
  userId: string,
  learningPathId: string,
  adminUserId: string,
) {
  const supabase = createAdminClient()
  return fromLoose<UserLearningPathAssignmentRow>(supabase, 'user_learning_path_assignments')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      learning_path_id: learningPathId,
      assigned_by: adminUserId,
      status: 'assigned',
    })
    .select(USER_ASSIGNMENT_WITH_USER_SELECT)
    .single()
}
