import type { CertificateRow, CombinedAssignmentRow, DashboardStats, EnrollmentRow } from './types'

export function createCertificatesMap(certificates: CertificateRow[]) {
  const certificatesMap = new Map<string, boolean>()
  certificates.forEach((certificate) => certificatesMap.set(certificate.course_id, true))
  return certificatesMap
}

export function calculateDashboardStats(
  combinedAssignments: CombinedAssignmentRow[],
  enrollmentsMap: Map<string, EnrollmentRow>,
  certificates: CertificateRow[]
): DashboardStats {
  const inProgress = combinedAssignments.filter((assignment) => {
    const enrollment = enrollmentsMap.get(assignment.course_id)
    const progress = enrollment?.overall_progress_percentage || assignment.completion_percentage || 0
    return progress > 0 && progress < 100
  }).length
  const completed = combinedAssignments.filter((assignment) => {
    const enrollment = enrollmentsMap.get(assignment.course_id)
    const progress = enrollment?.overall_progress_percentage || assignment.completion_percentage || 0
    return progress >= 100 ||
      assignment.status === 'completed' ||
      enrollment?.enrollment_status === 'completed'
  }).length

  return {
    total_assigned: combinedAssignments.length,
    in_progress: inProgress,
    completed,
    certificates: certificates.length,
  }
}
