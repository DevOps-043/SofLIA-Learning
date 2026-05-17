import { REPORTS_ANALYTICS_UNSPECIFIED } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'
import type { MutableCourseStats } from './mutable-course-stats'

export function ensureCourse(
  context: BuildContext,
  courseId: string | null | undefined,
  title: string | null | undefined,
): MutableCourseStats {
  const id = courseId || REPORTS_ANALYTICS_UNSPECIFIED
  const existing = context.courses.get(id)
  if (existing) {
    if (title && existing.courseTitle === id) {
      existing.courseTitle = title
    }
    return existing
  }

  const course: MutableCourseStats = {
    courseId: id,
    courseTitle: title || id,
    assignedUsers: new Set<string>(),
    activeLearners: new Set<string>(),
    completedUsers: new Set<string>(),
    progressByUser: new Map<string, number>(),
    overdueAssignments: 0,
    notesCount: 0,
    sofliaConversations: 0,
    activityTotal: 0,
    activityCompleted: 0,
    quizScores: [],
  }

  context.courses.set(id, course)
  return course
}
