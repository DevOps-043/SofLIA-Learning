import type { CertificateRow, DashboardStats, DirectAssignmentRow, EnrollmentRow } from './dashboard.types'

function getAssignmentProgress(
  assignment: DirectAssignmentRow,
  enrollmentsMap: Map<string, EnrollmentRow>,
) {
  const enrollment = enrollmentsMap.get(assignment.course_id)
  return enrollment?.overall_progress_percentage || assignment.completion_percentage || 0
}

export function buildDashboardStats(
  assignments: DirectAssignmentRow[],
  enrollmentsMap: Map<string, EnrollmentRow>,
  certificates: CertificateRow[],
): DashboardStats {
  const inProgress = assignments.filter((assignment) => {
    const progress = getAssignmentProgress(assignment, enrollmentsMap)
    return progress > 0 && progress < 100
  }).length

  const completed = assignments.filter((assignment) => {
    const enrollment = enrollmentsMap.get(assignment.course_id)
    const progress = getAssignmentProgress(assignment, enrollmentsMap)
    return progress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed'
  }).length

  return {
    total_assigned: assignments.length,
    in_progress: inProgress,
    completed,
    certificates: certificates.length,
  }
}
