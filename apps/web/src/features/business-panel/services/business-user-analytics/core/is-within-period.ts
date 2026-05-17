import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'

export function isWithinPeriod(value: string, period: Pick<BusinessUserAnalyticsPeriod, 'from' | 'to'>): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date >= new Date(period.from) && date <= new Date(period.to)
}
