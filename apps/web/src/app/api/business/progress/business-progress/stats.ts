import type { DashboardQueriesResult } from './types'

export function buildProgressStats(totalUsers: number, data: DashboardQueriesResult) {
  const totalCoursesAssigned = data.assignments.length
  const completedAssignments = data.assignments.filter(
    (assignment) => assignment.status === 'completed',
  ).length
  const progressSum = data.enrollments.reduce(
    (sum, enrollment) => sum + (Number(enrollment.overall_progress_percentage) || 0),
    0,
  )
  const averageProgress =
    data.enrollments.length > 0 ? progressSum / data.enrollments.length : 0
  const totalTimeSpentMinutes = data.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes || 0),
    0,
  )
  const completionRate =
    totalCoursesAssigned > 0
      ? Math.round((completedAssignments / totalCoursesAssigned) * 100 * 10) / 10
      : 0

  return {
    total_users: totalUsers,
    total_courses_assigned: totalCoursesAssigned,
    completed_courses: completedAssignments,
    average_progress: Math.round(averageProgress * 10) / 10,
    total_time_spent_hours: Math.round((totalTimeSpentMinutes / 60) * 10) / 10,
    completion_rate: completionRate,
  }
}
