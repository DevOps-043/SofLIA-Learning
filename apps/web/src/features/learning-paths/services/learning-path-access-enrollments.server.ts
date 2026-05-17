import { logger } from '@/lib/utils/logger'
import { isMissingLearningPathInfrastructureError } from './learning-path-access.errors'
import type { EnrollmentRow } from './learning-path-access.types'

export function buildEnrollmentMap(
  enrollmentRows: EnrollmentRow[] | null,
  organizationId?: string | null,
) {
  const enrollmentMap = new Map<string, EnrollmentRow>()

  for (const enrollment of enrollmentRows || []) {
    const current = enrollmentMap.get(enrollment.course_id)
    if (!current) {
      enrollmentMap.set(enrollment.course_id, enrollment)
      continue
    }

    const currentMatchesOrg = current.organization_id === organizationId
    const nextMatchesOrg = enrollment.organization_id === organizationId
    if (!currentMatchesOrg && nextMatchesOrg) {
      enrollmentMap.set(enrollment.course_id, enrollment)
    }
  }

  return enrollmentMap
}

export function isCourseCompleted(enrollment: EnrollmentRow | undefined) {
  if (!enrollment) return false

  return (
    enrollment.enrollment_status === 'completed' ||
    (enrollment.overall_progress_percentage ?? 0) >= 100
  )
}

export function handleEnrollmentLoadError(error: unknown) {
  if (isMissingLearningPathInfrastructureError(error as never)) return null

  logger.error('Error loading enrollments for learning path access:', error)
  throw new Error('No se pudo validar el progreso del learning path')
}
