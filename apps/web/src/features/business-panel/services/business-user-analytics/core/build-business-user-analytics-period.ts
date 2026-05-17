import type { BusinessUserAnalyticsPeriod, BusinessUserAnalyticsRange } from '../../../types/business-user-analytics.types'

export function buildBusinessUserAnalyticsPeriod(range: BusinessUserAnalyticsRange): BusinessUserAnalyticsPeriod {
  const daysByRange: Record<BusinessUserAnalyticsRange, number> = {
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  }
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (daysByRange[range] - 1))
  from.setUTCHours(0, 0, 0, 0)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    range,
  }
}
