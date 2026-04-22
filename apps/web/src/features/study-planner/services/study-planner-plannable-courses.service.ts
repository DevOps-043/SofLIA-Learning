import type { CourseAssignment } from '../types/user-context.types'

function isCompletedAssignment(course: CourseAssignment): boolean {
  return (
    course.status === 'completed'
    || course.status === 'cancelled'
    || (course.completionPercentage ?? 0) >= 100
  )
}

function buildPlannerAssignmentKey(course: CourseAssignment): string {
  if (course.organizationId) {
    return `${course.courseId}::${course.organizationId}`
  }

  return `${course.courseId}::${course.source}`
}

function choosePreferredAssignment(
  current: CourseAssignment,
  next: CourseAssignment,
): CourseAssignment {
  const sourcePriority: Record<CourseAssignment['source'], number> = {
    organization: 3,
    team: 2,
    purchase: 1,
  }

  if (sourcePriority[next.source] > sourcePriority[current.source]) {
    return next
  }

  if ((next.completionPercentage ?? 0) > (current.completionPercentage ?? 0)) {
    return {
      ...current,
      completionPercentage: next.completionPercentage,
      completedLessons: next.completedLessons ?? current.completedLessons,
      totalLessons: next.totalLessons ?? current.totalLessons,
      lastAccessedAt: next.lastAccessedAt ?? current.lastAccessedAt,
    }
  }

  if (!current.dueDate && next.dueDate) {
    return {
      ...current,
      dueDate: next.dueDate,
    }
  }

  return current
}

export function getStudyPlannerPlannableCourses(
  courses: CourseAssignment[],
): CourseAssignment[] {
  const plannableAssignments = new Map<string, CourseAssignment>()

  for (const course of courses) {
    if (!course.courseId || course.hasActivePlan || isCompletedAssignment(course)) {
      continue
    }

    const assignmentKey = buildPlannerAssignmentKey(course)
    const existing = plannableAssignments.get(assignmentKey)

    if (!existing) {
      plannableAssignments.set(assignmentKey, course)
      continue
    }

    plannableAssignments.set(
      assignmentKey,
      choosePreferredAssignment(existing, course),
    )
  }

  return [...plannableAssignments.values()].sort((left, right) => {
    const titleComparison = left.course.title.localeCompare(right.course.title)
    if (titleComparison !== 0) {
      return titleComparison
    }

    return (left.organizationName ?? '').localeCompare(right.organizationName ?? '')
  })
}
