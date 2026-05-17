import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationLearningPathAssignment } from '../../types'
import { mapOrganizationAssignment } from './assignment-mappers'
import { getLearningPathById, listLearningPaths } from './learning-paths.query'
import { notifyOrganizationUsersPathAssigned } from './organization-assignment-notifications.service'
import {
  createOrganizationAssignment,
  findOrganizationAssignment,
  reactivateOrganizationAssignment,
  revokeOrganizationAssignment,
} from './organization-assignment.repository'
import { syncCourseAccessForOrganization } from './organization-course-access.service'
import type { OrganizationLearningPathAssignmentRow } from './rows'

export async function listOrganizationAssignments(
  organizationId: string,
): Promise<OrganizationLearningPathAssignment[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .select('id, organization_id, learning_path_id, assigned_at, status')
    .eq('organization_id', organizationId)
    .order('assigned_at', { ascending: false })

  if (error) {
    logger.error('Error fetching organization learning path assignments:', error)
    throw new Error('No se pudieron cargar las asignaciones organizacionales')
  }

  const learningPaths = await listLearningPaths()
  const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))
  return (data || []).map((row) => mapOrganizationAssignment(row, learningPathMap.get(row.learning_path_id) || null))
}

export async function assignToOrganization(
  organizationId: string,
  learningPathId: string,
  adminUserId: string,
): Promise<OrganizationLearningPathAssignment> {
  const path = await getLearningPathById(learningPathId)
  if (!path) throw new Error('Learning path no encontrado')

  await syncCourseAccessForOrganization(organizationId, path.items.map((item) => item.course_id), adminUserId)

  const supabase = createAdminClient()
  const existing = await findOrganizationAssignment(supabase, organizationId, learningPathId)

  if (existing) {
    if (existing.status !== 'active') {
      await reactivateOrganizationAssignment(supabase, existing.id)
    }

    return mapOrganizationAssignment(existing, path, 'active')
  }

  const created = await createOrganizationAssignment(supabase, organizationId, learningPathId, adminUserId)
  await notifyOrganizationUsersPathAssigned(supabase, organizationId, learningPathId, path.title)
  return mapOrganizationAssignment(created, path)
}

export function revokeFromOrganization(organizationId: string, assignmentId: string) {
  const supabase = createAdminClient()
  return revokeOrganizationAssignment(supabase, organizationId, assignmentId)
}
