import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationLearningPathAssignment } from '../../types'
import type { OrganizationLearningPathAssignmentRow } from './assignment-row.types'
import { listLearningPaths } from './read-learning-paths.service'

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

  return (data || []).map((row) => ({
    id: row.id,
    organization_id: row.organization_id,
    learning_path_id: row.learning_path_id,
    assigned_at: row.assigned_at,
    status: row.status,
    learning_path: learningPathMap.get(row.learning_path_id) || null,
  }))
}
