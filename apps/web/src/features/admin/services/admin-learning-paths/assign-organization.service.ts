import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationLearningPathAssignment } from '../../types'
import type { OrganizationLearningPathAssignmentRow } from './assignment-row.types'
import { syncCourseAccessForOrganization } from './organization-course-access.service'
import { getLearningPathById } from './read-learning-paths.service'
import { ORGANIZATION_ASSIGNMENT_SELECT } from './selects'

export async function assignLearningPathToOrganization(
  organizationId: string,
  learningPathId: string,
  adminUserId: string,
): Promise<OrganizationLearningPathAssignment> {
  const path = await getLearningPathById(learningPathId)
  if (!path) {
    throw new Error('Learning path no encontrado')
  }

  await syncCourseAccessForOrganization(
    organizationId,
    path.items.map((item) => item.course_id),
    adminUserId,
  )

  const supabase = createAdminClient()
  const existing = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .select(ORGANIZATION_ASSIGNMENT_SELECT)
    .eq('organization_id', organizationId)
    .eq('learning_path_id', learningPathId)
    .maybeSingle()

  if (existing.error) {
    logger.error('Error checking organization learning path assignment:', existing.error)
    throw new Error('No se pudo asignar el learning path')
  }

  if (existing.data) {
    return reactivateOrganizationAssignmentIfNeeded(existing.data, path)
  }

  const { data, error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .insert({ organization_id: organizationId, learning_path_id: learningPathId, assigned_by: adminUserId, status: 'active' })
    .select(ORGANIZATION_ASSIGNMENT_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error assigning learning path to organization:', error)
    throw new Error('No se pudo asignar el learning path')
  }

  return { ...data, learning_path: path }
}

async function reactivateOrganizationAssignmentIfNeeded(
  assignment: OrganizationLearningPathAssignmentRow,
  path: OrganizationLearningPathAssignment['learning_path'],
) {
  if (assignment.status !== 'active') {
    const supabase = createAdminClient()
    const result = await fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', assignment.id)

    if (result.error) {
      logger.error('Error reactivating organization learning path assignment:', result.error)
      throw new Error('No se pudo reactivar la asignacion del learning path')
    }
  }

  return { ...assignment, status: 'active' as const, learning_path: path }
}
