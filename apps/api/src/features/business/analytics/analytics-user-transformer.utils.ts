import { buildUserAnalyticsEntry } from './analytics-user-entry.utils'
import type { AnalyticsTransformContext } from './analytics-transform-context.utils'
import type { AnalyticsSourceData } from './analytics.types'

export function buildUserAnalytics(
  source: AnalyticsSourceData,
  context: AnalyticsTransformContext,
) {
  return source.orgUsers.map((orgUser) =>
    buildUserAnalyticsEntry(orgUser, context),
  )
}
