import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { UserLearningPathAssignment } from '../../types'
import type { UserLearningPathAssignmentRow } from './assignment-row.types'
import { listLearningPaths } from './read-learning-paths.service'
import { USER_ASSIGNMENT_WITH_USER_SELECT } from './selects'

export async function listUserAssignments(
  organizationId: string,
): Promise<UserLearningPathAssignment[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<UserLearningPathAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select(USER_ASSIGNMENT_WITH_USER_SELECT)
    .eq('organization_id', organizationId)
    .order('assigned_at', { ascending: false })

  if (error) {
    logger.error('Error fetching user learning path assignments:', error)
    throw new Error('No se pudieron cargar las asignaciones individuales')
  }

  const learningPaths = await listLearningPaths()
  const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))

  return (data || []).map((row) => ({
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    learning_path_id: row.learning_path_id,
    assigned_at: row.assigned_at,
    status: row.status,
    learning_path: learningPathMap.get(row.learning_path_id) || null,
    user: row.users || null,
  }))
}
