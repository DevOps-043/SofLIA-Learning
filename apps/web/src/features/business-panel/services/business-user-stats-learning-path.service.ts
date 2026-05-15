import type { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/utils/logger'

type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>

interface LearningPathAssignmentIdRow {
  learning_path_id: string
}

interface LearningPathItemRow {
  learning_path_id: string
  course_id: string
  position: number | null
}

/**
 * Builds a `course_id → global order index` map based on the learning paths
 * assigned to the user (organization-level + user-level assignments).
 *
 * Courses are ordered by (learning path group, position within the path).
 * Courses that are not part of any assigned learning path are intentionally
 * absent from the map; the caller is expected to place them after the ordered
 * ones (a stable sort keeps their original relative order).
 *
 * The query mirrors `learning-path-dashboard.server.ts`: business users cannot
 * read the learning-path tables directly because of RLS, so this relies on the
 * admin client that the stats route already passes in. Auth is validated
 * upstream by `requireBusiness` in the route handler.
 *
 * Failures are logged and degrade gracefully to an empty map — the stats
 * response must still load even if learning-path ordering is unavailable.
 */
export async function fetchLearningPathCourseOrder(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
): Promise<Map<string, number>> {
  const courseOrder = new Map<string, number>()

  const [organizationAssignments, userAssignments] = await Promise.all([
    supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    supabase
      .from('user_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'assigned'),
  ])

  if (organizationAssignments.error) {
    logger.error(
      'Error loading org learning path assignments for user stats:',
      organizationAssignments.error,
    )
  }
  if (userAssignments.error) {
    logger.error(
      'Error loading user learning path assignments for user stats:',
      userAssignments.error,
    )
  }

  const learningPathIds = Array.from(
    new Set(
      [
        ...((organizationAssignments.data as LearningPathAssignmentIdRow[] | null) ?? []),
        ...((userAssignments.data as LearningPathAssignmentIdRow[] | null) ?? []),
      ]
        .map((row) => row.learning_path_id)
        .filter(Boolean),
    ),
  )

  if (learningPathIds.length === 0) {
    return courseOrder
  }

  // Ordered by (learning_path_id, position): groups each path's courses
  // together (deterministic, stable across requests) and respects the
  // author-defined sequence within each path.
  const itemsResult = await supabase
    .from('learning_path_items')
    .select('learning_path_id, course_id, position')
    .in('learning_path_id', learningPathIds)
    .order('learning_path_id', { ascending: true })
    .order('position', { ascending: true })

  if (itemsResult.error) {
    logger.error('Error loading learning path items for user stats:', itemsResult.error)
    return courseOrder
  }

  const items = (itemsResult.data as LearningPathItemRow[] | null) ?? []
  items.forEach((item, index) => {
    // First occurrence wins — a course can belong to more than one path.
    if (item.course_id && !courseOrder.has(item.course_id)) {
      courseOrder.set(item.course_id, index)
    }
  })

  return courseOrder
}
