import type { BusinessUserAnalyticsBreakdownItem } from '../../../types/business-user-analytics.types'
import { buildBreakdown, getProgressBand, incrementMap } from '../../reports-analytics/reports-analytics.helpers'

export function buildCourseProgressDistribution(values: number[]): BusinessUserAnalyticsBreakdownItem[] {
  const counts = new Map<string, number>()
  values.forEach((progress) => incrementMap(counts, getProgressBand(progress)))
  return buildBreakdown(counts, values.length)
}
