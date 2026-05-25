import type { BusinessUserAnalyticsRange } from '../../../types/business-user-analytics.types'

export function normalizeBusinessUserAnalyticsRange(
  value: string | null | undefined,
): BusinessUserAnalyticsRange {
  if (value === '30d' || value === '90d' || value === '180d' || value === '365d') {
    return value
  }

  return '365d'
}
