import type { ReportsAnalyticsBreakdownItem } from '../../../types/reports-analytics.types'
import { calculatePercentage } from './number.helpers'

export function buildBreakdown(
  counts: Map<string, number>,
  total: number,
  labels?: Map<string, string>,
): ReportsAnalyticsBreakdownItem[] {
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      key,
      label: labels?.get(key) || key,
      value,
      percentage: calculatePercentage(value, total),
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}

export function incrementMap(
  map: Map<string, number>,
  key: string,
  amount = 1,
): void {
  map.set(key, (map.get(key) || 0) + amount)
}
