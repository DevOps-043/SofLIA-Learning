import type {
  BusinessUserAnalyticsCourseProgressRow,
  BusinessUserAnalyticsOverview,
  BusinessUserAnalyticsQuality,
} from '../../../types/business-user-analytics.types'
import { calculateAverage, calculatePercentage } from '../../reports-analytics/reports-analytics.helpers'
import { calculateCurrentStreak } from './calculate-current-streak'
import { calculateLongestStreak } from './calculate-longest-streak'
import { CourseRowsSummary } from './summarize-course-rows'
import { getLatestDate } from './get-latest-date'
import { QueryData } from './query-data'

interface BuildAnalyticsOverviewInput {
  activeDateKeys: string[]
  contributionDates: string[]
  courseRows: BusinessUserAnalyticsCourseProgressRow[]
  data: QueryData
  quality: BusinessUserAnalyticsQuality
  summary: CourseRowsSummary
}

export function buildAnalyticsOverview({
  activeDateKeys,
  contributionDates,
  courseRows,
  data,
  quality,
  summary,
}: BuildAnalyticsOverviewInput): BusinessUserAnalyticsOverview {
  return {
    totalAssigned: courseRows.length,
    inProgressCourses: summary.inProgressCourses,
    completedCourses: summary.completedCourses,
    certificates: data.certificates.length,
    averageProgress: calculateAverage(courseRows.map((course) => course.progress)),
    completionRate: calculatePercentage(summary.completedCourses, courseRows.length),
    lessonsCompleted: summary.lessonsCompleted,
    timeSpentMinutes: summary.timeSpentMinutes,
    activeDays: activeDateKeys.length,
    currentStreak: calculateCurrentStreak(activeDateKeys),
    longestStreak: calculateLongestStreak(activeDateKeys),
    lastActivityAt: getLatestDate(contributionDates),
    qualityScore: quality.overallScore,
  }
}
