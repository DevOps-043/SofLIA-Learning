import type { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationLearningPathAssignmentRow } from './rows'

type AdminClient = ReturnType<typeof createAdminClient>

export async function findOrganizationAssignment(
  supabase: AdminClient,
  organizationId: string,
  learningPathId: string,
) {
  const result = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .select('id, organization_id, learning_path_id, assigned_at, status')
    .eq('organization_id', organizationId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()

  if (result.error) {
    logger.error('Error checking organization learning path assignment:', result.error)
    throw new Error('No se pudo asignar el learning path')
  }

  return result.data
}

export async function reactivateOrganizationAssignment(
  supabase: AdminClient,
  assignmentId: string,
) {
  const result = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', assignmentId)

  if (result.error) {
    logger.error('Error reactivating organization learning path assignment:', result.error)
    throw new Error('No se pudo reactivar la asignacion del learning path')
  }
}

export async function createOrganizationAssignment(
  supabase: AdminClient,
  organizationId: string,
  learningPathId: string,
  adminUserId: string,
) {
  const { data, error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .insert({ organization_id: organizationId, learning_path_id: learningPathId, assigned_by: adminUserId, status: 'active' })
    .select('id, organization_id, learning_path_id, assigned_at, status')
    .single()

  if (error || !data) {
    logger.error('Error assigning learning path to organization:', error)
    throw new Error('No se pudo asignar el learning path')
  }

  return data
}

export async function revokeOrganizationAssignment(
  supabase: AdminClient,
  organizationId: string,
  assignmentId: string,
) {
  const { error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', assignmentId)

  if (error) {
    logger.error('Error revoking organization learning path assignment:', error)
    throw new Error('No se pudo revocar el learning path')
  }
}
