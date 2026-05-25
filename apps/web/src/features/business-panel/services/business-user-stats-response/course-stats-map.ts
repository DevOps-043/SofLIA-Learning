import type { BusinessUserStatsCertificate } from '../../types/business-user-stats.types'
import type { BusinessUserStatsAssignmentRecord, BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'
import { normalizeCourseProgress, normalizeCourseStatus } from './course-status'
import { createEmptyCourseStats } from './empty-course-stats'

type CourseStatsMap = Map<string, ReturnType<typeof createEmptyCourseStats>>

export function createCourseStatsMap(
  enrollments: BusinessUserStatsQueryData['enrollments'],
  certificates: BusinessUserStatsCertificate[],
  assignments: BusinessUserStatsAssignmentRecord[],
) {
  const map: CourseStatsMap = new Map()

  enrollments.forEach((enrollment) => {
    const course = unwrapRelation(enrollment.courses)
    const progress = normalizeCourseProgress(enrollment.enrollment_status, Number(enrollment.overall_progress_percentage) || 0)
    map.set(enrollment.course_id, createEmptyCourseStats({
      courseId: enrollment.course_id, title: course?.title, progress,
      status: normalizeCourseStatus(enrollment.enrollment_status, progress),
      enrolledAt: enrollment.enrolled_at, completedAt: enrollment.completed_at,
      hasCertificate: certificates.some((certificate) => certificate.course_id === enrollment.course_id),
    }))
  })

  assignments.forEach((assignment) => mergeAssignmentStats(map, assignment, certificates))
  return map
}

function mergeAssignmentStats(map: CourseStatsMap, assignment: BusinessUserStatsAssignmentRecord, certificates: BusinessUserStatsCertificate[]) {
  const assignmentProgress = normalizeCourseProgress(assignment.status, Number(assignment.completion_percentage) || 0)
  const assignmentStatus = normalizeCourseStatus(assignment.status, assignmentProgress)
  const existing = map.get(assignment.course_id)

  if (existing) {
    existing.is_assigned = true
    existing.assignment_status = assignment.status
    existing.assigned_at = assignment.assigned_at
    existing.due_date = assignment.due_date
    if (assignmentProgress > existing.progress) existing.progress = assignmentProgress
    if (assignmentStatus === 'completed') {
      existing.status = 'completed'
      existing.completed_at = existing.completed_at || assignment.completed_at
    }
    return
  }

  const course = unwrapRelation(assignment.courses)
  map.set(assignment.course_id, createEmptyCourseStats({
    courseId: assignment.course_id, title: course?.title, progress: assignmentProgress, status: assignmentStatus,
    enrolledAt: null, assignedAt: assignment.assigned_at, dueDate: assignment.due_date, completedAt: assignment.completed_at,
    assignmentStatus: assignment.status, isAssigned: true,
    hasCertificate: certificates.some((certificate) => certificate.course_id === assignment.course_id),
  }))
}
