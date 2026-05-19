import type { AssignmentRow } from './types'
import type { BusinessProgressUserMetric } from './user-metrics'
import type { CourseProgressMetric } from './course-metrics'

export function buildProgressCharts(input: {
  assignments: AssignmentRow[]
  coursesData: CourseProgressMetric[]
  usersData: BusinessProgressUserMetric[]
}) {
  return {
    distribution: buildDistribution(input.assignments),
    progress_by_course: input.coursesData
      .map((course) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        progress: course.average_progress,
        total_assigned: course.total_assigned,
        completed: course.completed,
      }))
      .sort((a, b) => b.progress - a.progress),
    progress_by_user: input.usersData
      .sort((a, b) => b.average_progress - a.average_progress)
      .slice(0, 10)
      .map((user) => ({
        user_id: user.user_id,
        display_name: user.display_name,
        progress: user.average_progress,
      })),
    completion_trends: buildCompletionTrends(input.assignments),
    time_by_course: input.coursesData
      .filter((course) => course.total_time_hours > 0)
      .sort((a, b) => b.total_time_hours - a.total_time_hours)
      .map((course) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        total_hours: course.total_time_hours,
      })),
  }
}

function buildDistribution(assignments: AssignmentRow[]) {
  return [
    { name: 'Completados', value: assignments.filter((item) => item.status === 'completed').length, color: 'var(--color-success)' },
    { name: 'En Progreso', value: assignments.filter((item) => item.status === 'in_progress').length, color: 'var(--color-warning)' },
    { name: 'No Iniciados', value: assignments.filter((item) => item.status === 'assigned').length, color: 'var(--color-legacy-6b7280)' },
  ]
}

function buildCompletionTrends(assignments: AssignmentRow[]) {
  const completionTrends = assignments
    .filter((assignment) => assignment.completed_at)
    .reduce((acc: Record<string, number>, assignment) => {
      const date = new Date(assignment.completed_at!)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {})

  return Object.entries(completionTrends)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
