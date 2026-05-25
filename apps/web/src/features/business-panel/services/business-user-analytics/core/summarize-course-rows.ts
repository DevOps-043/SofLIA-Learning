import type { BusinessUserAnalyticsCourseProgressRow } from '../../../types/business-user-analytics.types'
import { roundNumber } from './round-number'

export interface CourseRowsSummary {
  completedCourses: number
  inProgressCourses: number
  lessonsCompleted: number
  timeSpentMinutes: number
}

export function summarizeCourseRows(rows: BusinessUserAnalyticsCourseProgressRow[]): CourseRowsSummary {
  return {
    completedCourses: rows.filter((course) => course.progress >= 100 || course.status === 'completed').length,
    inProgressCourses: rows.filter((course) => course.progress > 0 && course.progress < 100).length,
    lessonsCompleted: rows.reduce((sum, course) => sum + course.lessonsCompleted, 0),
    timeSpentMinutes: roundNumber(rows.reduce((sum, course) => sum + course.timeSpentMinutes, 0)),
  }
}
