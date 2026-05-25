import {
  getAssignmentProgress,
  isAssignmentCompleted,
} from './analytics-aggregation.utils'
import type { AnalyticsTransformContext } from './analytics-transform-context.utils'
import type { AnalyticsSourceData } from './analytics.types'

export function buildCourseDistribution(
  source: AnalyticsSourceData,
  context: AnalyticsTransformContext,
) {
  const distributionByStatus = new Map<string, number>()

  for (const assignment of source.assignments) {
    const progress = getAssignmentProgress(assignment, context.enrollmentMap)
    const status = isAssignmentCompleted(assignment, context.enrollmentMap)
      ? 'completed'
      : progress > 0
        ? 'in_progress'
        : 'not_started'

    distributionByStatus.set(
      status,
      (distributionByStatus.get(status) ?? 0) + 1,
    )
  }

  return Array.from(distributionByStatus.entries()).map(([status, count]) => ({
    status,
    count,
  }))
}
