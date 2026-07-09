import type { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { isMissingLearningPathAssignmentMetadataError } from './errors'
import {
  USER_ASSIGNMENT_FALLBACK_SELECT,
  USER_ASSIGNMENT_SELECT,
} from './user-assignment-selects'
import type { UserLearningPathAssignmentRow } from './rows'

type AdminClient = ReturnType<typeof createAdminClient>

export async function listRawUserAssignments(
  supabase: AdminClient,
  organizationId: string,
) {
  let result = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select(USER_ASSIGNMENT_SELECT)
    .eq('organization_id', organizationId)
    .order('assigned_at', { ascending: false })

  if (result.error && isMissingLearningPathAssignmentMetadataError(result.error)) {
    result = await fromLoose<UserLearningPathAssignmentRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .select(USER_ASSIGNMENT_FALLBACK_SELECT)
      .eq('organization_id', organizationId)
      .order('assigned_at', { ascending: false })
  }

  if (result.error) {
    logger.error('Error fetching user learning path assignments:', result.error)
    throw new Error('No se pudieron cargar las asignaciones individuales')
  }

  return result.data || []
}

export async function findUserAssignmentById(
  supabase: AdminClient,
  organizationId: string,
  assignmentId: string,
) {
  const result = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select('id, organization_id, user_id, learning_path_id, status')
    .eq('organization_id', organizationId)
    .eq('id', assignmentId)
    .maybeSingle()

  if (result.error) {
    logger.error('Error loading user learning path assignment by id:', result.error)
    throw new Error('No se pudo cargar la asignacion del learning path')
  }

  return result.data
}

export async function findUserAssignment(
  supabase: AdminClient,
  organizationId: string,
  userId: string,
  learningPathId: string,
) {
  const result = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select(USER_ASSIGNMENT_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()

  if (result.error) {
    logger.error('Error checking user learning path assignment:', result.error)
    throw new Error('No se pudo asignar el learning path al usuario')
  }

  return result.data
}
