import type { ReportsAnalyticsCourseRow } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED, calculateAverage, calculatePercentage } from '../reports-analytics.helpers'
import type { BuildContext } from './build-context'

export function finalizeCourses(context: BuildContext): ReportsAnalyticsCourseRow[] {
  return Array.from(context.courses.values())
    .filter((course) => course.courseId !== REPORTS_ANALYTICS_UNSPECIFIED)
    .map((course) => ({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      assignedUsers: course.assignedUsers.size,
      activeLearners: course.activeLearners.size,
      completedUsers: course.completedUsers.size,
      averageProgress: calculateAverage(Array.from(course.progressByUser.values())),
      overdueAssignments: course.overdueUsers.size,
      notesCount: course.notesCount,
      sofliaConversations: course.sofliaConversations,
      activityCompletionRate: calculatePercentage(course.activityCompleted, course.activityTotal),
      quizAverageScore: calculateAverage(course.quizScores),
    }))
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments || a.courseTitle.localeCompare(b.courseTitle))
}
