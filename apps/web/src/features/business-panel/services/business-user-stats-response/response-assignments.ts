import type {
  BusinessUserStatsApiResponse,
} from '../../types/business-user-stats.types'
import type { BusinessUserStatsAssignmentRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function buildAssignmentResponses(
  assignments: BusinessUserStatsAssignmentRecord[],
): BusinessUserStatsApiResponse['assignments'] {
  return assignments.map((assignment) => ({
    assignment_id: assignment.id,
    course_id: assignment.course_id,
    course_title: unwrapRelation(assignment.courses)?.title || 'Curso desconocido',
    status: assignment.status,
    completion_percentage: assignment.completion_percentage || 0,
    assigned_at: assignment.assigned_at,
    due_date: assignment.due_date,
    completed_at: assignment.completed_at,
  }))
}
