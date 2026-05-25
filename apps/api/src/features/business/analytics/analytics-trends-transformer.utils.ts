import {
  formatTrendMap,
  isAssignmentCompleted,
  processTrend,
} from './analytics-aggregation.utils'
import { roundToTwoDecimals } from './analytics-math.utils'
import type { AnalyticsTransformContext } from './analytics-transform-context.utils'
import type { AnalyticsSourceData } from './analytics.types'

export function buildAnalyticsTrends(
  source: AnalyticsSourceData,
  context: AnalyticsTransformContext,
) {
  const enrollmentsByMonth = new Map<string, number>()
  const completionsByMonth = new Map<string, number>()
  const timeByMonth = new Map<string, number>()
  const activeUsersByMonth = new Map<string, Set<string>>()

  for (const assignment of source.assignments) {
    processTrend(assignment.assigned_at, enrollmentsByMonth)
    if (isAssignmentCompleted(assignment, context.enrollmentMap)) {
      processTrend(assignment.completed_at, completionsByMonth)
    }
  }

  for (const progress of source.lessonProgress) {
    processTrend(
      progress.completed_at ?? progress.last_accessed_at,
      timeByMonth,
      progress.time_spent_minutes ?? 0,
    )
  }

  for (const entry of source.dailyProgress) {
    if (!entry.had_activity) continue
    const monthKey = entry.progress_date.slice(0, 7)
    const users = activeUsersByMonth.get(monthKey) ?? new Set<string>()
    users.add(entry.user_id)
    activeUsersByMonth.set(monthKey, users)
  }

  return {
    enrollments_by_month: formatTrendMap(enrollmentsByMonth),
    completions_by_month: formatTrendMap(completionsByMonth),
    time_by_month: formatTrendMap(timeByMonth).map((entry) => ({
      ...entry,
      count: roundToTwoDecimals(entry.count / 60),
    })),
    active_users_by_month: Array.from(activeUsersByMonth.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((left, right) => left.date.localeCompare(right.date)),
  }
}
