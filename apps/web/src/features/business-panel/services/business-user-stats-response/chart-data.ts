import type {
  BusinessUserStatsCompletedByMonthPoint,
  BusinessUserStatsCourseData,
  BusinessUserStatsTimeByCoursePoint,
} from '../../types/business-user-stats.types'
import type {
  BusinessUserStatsAssignmentRecord,
  BusinessUserStatsQueryData,
} from '../business-user-stats-query.service'

export function buildTimeByCourse(
  coursesData: BusinessUserStatsCourseData[],
): BusinessUserStatsTimeByCoursePoint[] {
  return coursesData.map((course) => ({
    course_id: course.course_id,
    course_title: course.course_title,
    total_minutes: course.time_spent_minutes || 0,
    total_hours: Math.round(((course.time_spent_minutes || 0) / 60) * 10) / 10,
  }))
}

export function buildCompletedByMonth(
  enrollments: BusinessUserStatsQueryData['enrollments'],
  assignments: BusinessUserStatsAssignmentRecord[],
): BusinessUserStatsCompletedByMonthPoint[] {
  const completedAtByCourse = new Map<string, string>()

  enrollments.forEach((enrollment) => {
    if (enrollment.completed_at) {
      completedAtByCourse.set(enrollment.course_id, enrollment.completed_at)
    }
  })

  assignments.forEach((assignment) => {
    if (assignment.completed_at && !completedAtByCourse.has(assignment.course_id)) {
      completedAtByCourse.set(assignment.course_id, assignment.completed_at)
    }
  })

  const countByMonth = Array.from(completedAtByCourse.values()).reduce(
    (map, completedAt) => {
      const date = new Date(completedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      map.set(monthKey, (map.get(monthKey) || 0) + 1)
      return map
    },
    new Map<string, number>(),
  )

  return Array.from(countByMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((left, right) => left.month.localeCompare(right.month))
}
