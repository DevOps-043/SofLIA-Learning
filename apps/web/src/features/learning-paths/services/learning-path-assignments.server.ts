import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { isMissingLearningPathInfrastructureError } from './learning-path-access.errors'

export async function loadAssignedLearningPathIds(
  userId: string,
  organizationId?: string | null,
) {
  const supabase = await createClient()
  const assignedIds = new Set<string>()
  const explicitlyRevokedIds = new Set<string>()

  if (organizationId) {
    const { data, error } = await supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .returns<{ learning_path_id: string }[]>()

    if (error) {
      if (isMissingLearningPathInfrastructureError(error)) return []
      handleAssignmentError(error)
    }
    for (const row of data || []) assignedIds.add(row.learning_path_id)
  }

  const userQuery = supabase
    .from('user_learning_path_assignments')
    .select('learning_path_id, status')
    .eq('user_id', userId)

  if (organizationId) userQuery.eq('organization_id', organizationId)

  const { data: userAssignments, error: userError } =
    await userQuery.returns<{ learning_path_id: string; status: 'assigned' | 'revoked' }[]>()

  if (userError) {
    if (isMissingLearningPathInfrastructureError(userError)) return []
    handleAssignmentError(userError)
  }
  for (const row of userAssignments || []) {
    if (row.status === 'revoked') {
      explicitlyRevokedIds.add(row.learning_path_id)
      continue
    }

    if (row.status === 'assigned') {
      assignedIds.add(row.learning_path_id)
    }
  }

  for (const learningPathId of explicitlyRevokedIds) {
    assignedIds.delete(learningPathId)
  }

  return [...assignedIds]
}

function handleAssignmentError(error: unknown) {
  logger.error('Error loading learning path assignments:', error)
  throw new Error('No se pudo validar el acceso al learning path')
}
