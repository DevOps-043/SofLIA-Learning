import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { syncCourseAccessForOrganization } from './organization-course-access.service'
import { syncCourseAccessForUser } from './user-course-access.service'
import type {
  OrganizationLearningPathAssignmentRow,
  UserLearningPathAssignmentRow,
} from './rows'

export async function syncNewCourseAccessForExistingLearningPathAssignments(
  learningPathId: string,
  courseId: string,
  adminUserId: string,
) {
  const supabase = createAdminClient()
  const [organizationAssignments, userAssignments] = await Promise.all([
    fromLoose<OrganizationLearningPathAssignmentRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select('id, organization_id, learning_path_id, assigned_by, assigned_at, status')
      .eq('learning_path_id', learningPathId)
      .eq('status', 'active'),
    fromLoose<UserLearningPathAssignmentRow>(supabase, 'user_learning_path_assignments')
      .select('id, organization_id, user_id, learning_path_id, assigned_by, assigned_at, status')
      .eq('learning_path_id', learningPathId)
      .eq('status', 'assigned'),
  ])

  if (organizationAssignments.error) {
    logger.error('Error loading organization assignments for learning path item sync:', organizationAssignments.error)
    throw new Error('No se pudo sincronizar el nuevo taller con las empresas asignadas')
  }

  if (userAssignments.error) {
    logger.error('Error loading user assignments for learning path item sync:', userAssignments.error)
    throw new Error('No se pudo sincronizar el nuevo taller con los usuarios asignados')
  }

  for (const assignment of organizationAssignments.data || []) {
    await syncCourseAccessForOrganization(
      assignment.organization_id,
      [courseId],
      assignment.assigned_by || adminUserId,
    )
  }

  for (const assignment of userAssignments.data || []) {
    const assignedBy = assignment.assigned_by || adminUserId
    await syncCourseAccessForOrganization(assignment.organization_id, [courseId], assignedBy)
    await syncCourseAccessForUser(assignment.organization_id, assignment.user_id, [courseId], assignedBy)
  }
}
