import { buildProgressCharts } from './charts'
import { buildCourseMetrics } from './course-metrics'
import { buildUserMetrics } from './user-metrics'
import type { CourseInfo, OrgUserRow, ProgressCollections } from './types'

interface BuildBusinessProgressResponseInput extends ProgressCollections {
  orgUsers: OrgUserRow[]
  courseInfoMap: Map<string, CourseInfo>
}

export function buildBusinessProgressResponse(input: BuildBusinessProgressResponseInput) {
  const coursesData = buildCourseMetrics(input)
  const usersData = buildUserMetrics(input)
  const totalCoursesAssigned = input.assignments.length
  const completedAssignments = input.assignments.filter((assignment) => assignment.status === 'completed').length
  const progressSum = input.enrollments.reduce((sum, item) => sum + (Number(item.overall_progress_percentage) || 0), 0)
  const averageProgress = input.enrollments.length > 0 ? progressSum / input.enrollments.length : 0
  const timeSpentMinutes = input.lessonProgress.reduce((sum, item) => sum + (item.time_spent_minutes || 0), 0)

  return {
    success: true,
    stats: {
      total_users: input.orgUsers.length,
      total_courses_assigned: totalCoursesAssigned,
      completed_courses: completedAssignments,
      average_progress: Math.round(averageProgress * 10) / 10,
      total_time_spent_hours: Math.round((timeSpentMinutes / 60) * 10) / 10,
      completion_rate: totalCoursesAssigned > 0
        ? Math.round((completedAssignments / totalCoursesAssigned) * 100 * 10) / 10
        : 0,
    },
    courses: coursesData,
    users: usersData,
    charts: buildProgressCharts({
      assignments: input.assignments,
      coursesData,
      usersData,
    }),
  }
}
