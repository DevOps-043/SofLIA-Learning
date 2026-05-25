import type {
  BusinessUserAnalyticsCourseProgressRow,
  BusinessUserAnalyticsLearning,
  BusinessUserAnalyticsPeriod,
} from '../../../types/business-user-analytics.types'
import { buildCourseProgressDistribution } from './build-course-progress-distribution'
import { buildTrend } from './build-trend'
import { getCourseCompletionDate } from './get-course-completion-date'
import { QueryData } from './query-data'

export function buildLearningSummary(
  data: QueryData,
  period: BusinessUserAnalyticsPeriod,
  courseRows: BusinessUserAnalyticsCourseProgressRow[],
): BusinessUserAnalyticsLearning {
  return {
    courses: courseRows,
    progressDistribution: buildCourseProgressDistribution(courseRows.map((course) => course.progress)),
    completionsTrend: buildTrend(
      data.assignments
        .map((assignment) => getCourseCompletionDate(assignment, data.enrollments))
        .filter((value): value is string => Boolean(value)),
      period,
    ),
    lessonTrend: buildTrend(
      data.lessonProgress
        .filter((item) => item.is_completed || item.lesson_status === 'completed')
        .map((item) => item.completed_at || item.updated_at)
        .filter((value): value is string => Boolean(value)),
      period,
    ),
  }
}
