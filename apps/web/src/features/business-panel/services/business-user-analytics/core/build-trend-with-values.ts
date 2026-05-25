import type { BusinessUserAnalyticsPeriod, BusinessUserAnalyticsTrendPoint } from '../../../types/business-user-analytics.types'
import { buildPeriodKey, buildPeriodTrend, calculateAverage } from '../../reports-analytics/reports-analytics.helpers'
import { getRowDate } from './get-row-date'
import { isWithinPeriod } from './is-within-period'
import { PERIOD_GRANULARITY } from './period_granularity'

export function buildTrendWithValues<T>(
  rows: T[],
  period: BusinessUserAnalyticsPeriod,
  valueSelector: (row: T) => number,
): BusinessUserAnalyticsTrendPoint[] {
  const groups = new Map<string, number[]>()
  rows.forEach((row) => {
    const date = getRowDate(row)
    if (!date || !isWithinPeriod(date, period)) return
    const key = buildPeriodKey(date, PERIOD_GRANULARITY)
    groups.set(key, [...(groups.get(key) || []), valueSelector(row)])
  })

  const averaged = new Map<string, number>()
  groups.forEach((values, key) => averaged.set(key, calculateAverage(values)))
  return buildPeriodTrend(averaged, { from: period.from, to: period.to, granularity: PERIOD_GRANULARITY })
}
