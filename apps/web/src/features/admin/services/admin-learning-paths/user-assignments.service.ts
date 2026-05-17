import { createAdminClient } from '@/lib/supabase/admin'
import type { UserLearningPathAssignment } from '../../types'
import { mapUserAssignment } from './assignment-mappers'
import { listLearningPaths } from './learning-paths.query'
import { listRawUserAssignments } from './user-assignment-read.repository'
import { revokeUserAssignment } from './user-assignment-write.repository'

export async function listUserAssignments(
  organizationId: string,
): Promise<UserLearningPathAssignment[]> {
  const supabase = createAdminClient()
  const rows = await listRawUserAssignments(supabase, organizationId)
  const learningPaths = await listLearningPaths()
  const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))

  return rows.map((row) =>
    mapUserAssignment(row, learningPathMap.get(row.learning_path_id) || null),
  )
}

export function revokeFromUser(
  organizationId: string,
  assignmentId: string,
) {
  const supabase = createAdminClient()
  return revokeUserAssignment(supabase, organizationId, assignmentId)
}
