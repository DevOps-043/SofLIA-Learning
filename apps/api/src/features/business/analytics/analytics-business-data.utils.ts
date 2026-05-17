import { getAssignmentProgress, isAssignmentCompleted } from './analytics-aggregation.utils'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from './analytics-metrics.utils'
import { roundToTwoDecimals, roundToWhole } from './analytics-math.utils'
import { buildAnalyticsTransformContext } from './analytics-transform-context.utils'
import { buildAnalyticsTrends } from './analytics-trends-transformer.utils'
import { buildCourseDistribution } from './analytics-course-distribution.utils'
import { getEmptyBusinessAnalyticsData } from './analytics-empty-data.utils'
import { buildRoleMetrics } from './analytics-role-transformer.utils'
import { buildTeamsAnalytics } from './analytics-team-transformer.utils'
import { buildUserAnalytics } from './analytics-user-transformer.utils'
import type { AnalyticsSourceData, BusinessAnalyticsData } from './analytics.types'

export function buildBusinessAnalyticsData(
  source: AnalyticsSourceData,
): BusinessAnalyticsData {
  if (source.orgUsers.length === 0) {
    return getEmptyBusinessAnalyticsData(source.organization)
  }

  const context = buildAnalyticsTransformContext(source)
  const userAnalytics = buildUserAnalytics(source, context)
  const totalCoursesAssigned = source.assignments.length
  const completedCourses = source.assignments.filter((assignment) =>
    isAssignmentCompleted(assignment, context.enrollmentMap),
  ).length

  return {
    organization: source.organization,
    general_metrics: {
      total_users: source.orgUsers.length,
      total_courses_assigned: totalCoursesAssigned,
      completed_courses: completedCourses,
      average_progress: calculateAverageProgress(source, context),
      total_time_hours: calculateTotalTimeHours(source),
      total_certificates: source.certificates.length,
      active_users: context.activeUserIds.size,
      retention_rate:
        source.orgUsers.length > 0
          ? roundToWhole((context.activeUserIds.size / source.orgUsers.length) * 100)
          : 0,
    },
    user_analytics: userAnalytics,
    trends: buildAnalyticsTrends(source, context),
    by_role: buildRoleMetrics(userAnalytics),
    course_metrics: { distribution: buildCourseDistribution(source, context) },
    engagement_metrics: {
      stickiness: calculateStickiness(source.dailyProgress),
      frequency: calculateFrequency(source.dailyProgress, source.activeSinceDate),
      streaks: calculateStreaks(
        source.dailyProgress,
        source.orgUsers.map((user) => user.user_id),
      ),
      heatmap: calculateHeatmap(source.studySessions),
      duration: calculateDuration(source.studySessions, source.orgUsers),
    },
    teams: buildTeamsAnalytics(source.nodes, context),
  }
}

function calculateAverageProgress(
  source: AnalyticsSourceData,
  context: ReturnType<typeof buildAnalyticsTransformContext>,
) {
  if (source.assignments.length === 0) return 0

  const totalProgress = source.assignments.reduce(
    (sum, assignment) =>
      sum + getAssignmentProgress(assignment, context.enrollmentMap),
    0,
  )

  return roundToTwoDecimals(totalProgress / source.assignments.length)
}

function calculateTotalTimeHours(source: AnalyticsSourceData) {
  const minutes = source.lessonProgress.reduce(
    (sum, progress) => sum + (progress.time_spent_minutes ?? 0),
    0,
  )

  return roundToTwoDecimals(minutes / 60)
}
