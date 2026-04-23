import type { CourseProgressSummary, DashboardQueriesResult } from './types'

type UserProgressChartSource = Array<{
  user_id: string
  display_name: string | null
  average_progress: number
}>

export function buildProgressCharts(
  data: DashboardQueriesResult,
  courses: CourseProgressSummary[],
  users: UserProgressChartSource,
) {
  return {
    distribution: buildDistribution(data),
    progress_by_course: buildProgressByCourse(courses),
    progress_by_user: buildProgressByUser(users),
    completion_trends: buildCompletionTrends(data),
    time_by_course: buildTimeByCourse(courses),
  }
}

function buildDistribution(data: DashboardQueriesResult) {
  return [
    { name: 'Completados', value: countAssignments(data, 'completed'), color: '#10b981' },
    { name: 'En Progreso', value: countAssignments(data, 'in_progress'), color: '#f59e0b' },
    { name: 'No Iniciados', value: countAssignments(data, 'assigned'), color: '#6b7280' },
  ]
}

function countAssignments(data: DashboardQueriesResult, status: string) {
  return data.assignments.filter((assignment) => assignment.status === status).length
}

function buildProgressByCourse(courses: CourseProgressSummary[]) {
  return courses
    .map((course) => ({
      course_id: course.course_id,
      course_title: course.course_title,
      progress: course.average_progress,
      total_assigned: course.total_assigned,
      completed: course.completed,
    }))
    .sort((a, b) => b.progress - a.progress)
}

function buildProgressByUser(users: UserProgressChartSource) {
  return users
    .sort((a, b) => (b.average_progress || 0) - (a.average_progress || 0))
    .slice(0, 10)
    .map((user) => ({
      user_id: user.user_id,
      display_name: user.display_name,
      progress: user.average_progress,
    }))
}

function buildCompletionTrends(data: DashboardQueriesResult) {
  const completionTrends = data.assignments
    .filter((assignment) => assignment.completed_at)
    .reduce((acc: Record<string, number>, assignment) => {
      const date = new Date(assignment.completed_at!)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthKey = `${date.getFullYear()}-${month}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {})

  return Object.entries(completionTrends)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function buildTimeByCourse(courses: CourseProgressSummary[]) {
  return courses
    .filter((course) => course.total_time_hours > 0)
    .sort((a, b) => b.total_time_hours - a.total_time_hours)
    .map((course) => ({
      course_id: course.course_id,
      course_title: course.course_title,
      total_hours: course.total_time_hours,
    }))
}
