import { getAssignmentProgress } from './assignment-progress'
import type {
  CombinedAssignmentRow,
  DashboardStats,
  EnrollmentRow,
} from './types'

export function buildDashboardStats(
  combinedAssignments: CombinedAssignmentRow[],
  enrollmentsMap: Map<string, EnrollmentRow>,
  certificatesCount: number,
): DashboardStats {
  const inProgress = combinedAssignments.filter((assignment) => {
    const progress = getAssignmentProgress(assignment, enrollmentsMap)
    return progress > 0 && progress < 100
  }).length

  const completed = combinedAssignments.filter((assignment) => {
    const enrollment = enrollmentsMap.get(assignment.course_id)
    const progress = getAssignmentProgress(assignment, enrollmentsMap)
    return progress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed'
  }).length

  return {
    total_assigned: combinedAssignments.length,
    in_progress: inProgress,
    completed,
    certificates: certificatesCount,
  }
}
