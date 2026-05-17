import 'server-only'

import { buildEnrollmentMap, handleEnrollmentLoadError } from './learning-path-access-enrollments.server'
import {
  loadCourseAndEnrollmentRows,
  loadLearningPathItems,
  loadSelectedLearningPathForCourse,
} from './learning-path-access-queries.server'
import { buildLearningPathAccessState } from './learning-path-access-state.mapper'
import type { LearningPathAccessState } from './learning-path-access.types'
import { loadAssignedLearningPathIds } from './learning-path-assignments.server'
import { persistProgressSnapshot } from './learning-path-progress-snapshot.server'

export type { LearningPathAccessState } from './learning-path-access.types'

export async function resolveLearningPathAccessForCourse(params: {
  userId: string
  courseId: string
  organizationId?: string | null
}): Promise<LearningPathAccessState | null> {
  const { userId, courseId, organizationId } = params
  const assignedPathIds = await loadAssignedLearningPathIds(userId, organizationId)
  if (assignedPathIds.length === 0) return null

  const selectedPath = await loadSelectedLearningPathForCourse(courseId, assignedPathIds)
  if (!selectedPath) return null

  const items = await loadLearningPathItems(selectedPath.id)
  if (!items) return null

  const itemCourseIds = items.map((item) => item.course_id)
  const courseAndEnrollmentRows = await loadCourseAndEnrollmentRows(userId, itemCourseIds)
  if (!courseAndEnrollmentRows) return null

  const { courses, enrollmentRows, enrollmentError } = courseAndEnrollmentRows
  if (enrollmentError) return handleEnrollmentLoadError(enrollmentError)

  const state = buildLearningPathAccessState({
    selectedPath,
    items,
    courses,
    enrollmentMap: buildEnrollmentMap(enrollmentRows, organizationId),
    currentCourseId: courseId,
  })

  await persistProgressSnapshot(userId, organizationId, state)

  return state
}
