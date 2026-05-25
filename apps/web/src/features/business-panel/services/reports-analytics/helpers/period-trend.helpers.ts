import type {
  ReportsAnalyticsFilters,
  ReportsAnalyticsTimeGranularity,
  ReportsAnalyticsTrendPoint,
} from '../../../types/reports-analytics.types'
import { buildBreakdown } from './breakdown.helpers'
import { REPORTS_ANALYTICS_UNSPECIFIED } from './constants'

export function buildMonthKey(value: string): string {
  return buildPeriodKey(value, 'month')
}

export function buildPeriodKey(
  value: string,
  granularity: ReportsAnalyticsTimeGranularity,
): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return REPORTS_ANALYTICS_UNSPECIFIED

  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  if (granularity === 'day') return `${year}-${month}-${day}`
  if (granularity === 'year') return year
  return `${year}-${month}`
}

export function buildMonthlyTrend(
  counts: Map<string, number>,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): ReportsAnalyticsTrendPoint[] {
  return buildPeriodTrend(counts, { ...filters, granularity: 'month' })
}

export function buildPeriodTrend(
  counts: Map<string, number>,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to' | 'granularity'>,
): ReportsAnalyticsTrendPoint[] {
  const from = new Date(filters.from)
  const to = new Date(filters.to)
  const points: ReportsAnalyticsTrendPoint[] = []

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0)
    return buildBreakdown(counts, total)
  }

  const cursor = getPeriodStart(from, filters.granularity)
  const end = getPeriodStart(to, filters.granularity)

  while (cursor <= end) {
    const key = buildPeriodKey(cursor.toISOString(), filters.granularity)
    points.push({ key, label: key, value: counts.get(key) || 0 })
    incrementPeriodCursor(cursor, filters.granularity)
  }

  return points
}

function getPeriodStart(
  date: Date,
  granularity: ReportsAnalyticsTimeGranularity,
): Date {
  if (granularity === 'day') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  }

  if (granularity === 'year') {
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function incrementPeriodCursor(
  date: Date,
  granularity: ReportsAnalyticsTimeGranularity,
): void {
  if (granularity === 'day') {
    date.setUTCDate(date.getUTCDate() + 1)
    return
  }

  if (granularity === 'year') {
    date.setUTCFullYear(date.getUTCFullYear() + 1)
    return
  }

  date.setUTCMonth(date.getUTCMonth() + 1)
}
