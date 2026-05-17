import type { BusinessUserAnalyticsPeriod, BusinessUserAnalyticsTrendPoint } from '../../../types/business-user-analytics.types'
import { buildPeriodKey, buildPeriodTrend, incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { isWithinPeriod } from './is-within-period'
import { PERIOD_GRANULARITY } from './period_granularity'

export function buildTrend(dates: string[], period: BusinessUserAnalyticsPeriod): BusinessUserAnalyticsTrendPoint[] {
  const counts = new Map<string, number>()
  dates.forEach((date) => {
    if (!isWithinPeriod(date, period)) return
    incrementMap(counts, buildPeriodKey(date, PERIOD_GRANULARITY))
  })

  return buildPeriodTrend(counts, { from: period.from, to: period.to, granularity: PERIOD_GRANULARITY })
}
