import type { AnalyticsDateRange, AnalyticsRequestParams } from './types'

export function readAnalyticsRequestParams(request: Request): AnalyticsRequestParams {
  const { searchParams } = new URL(request.url)

  return {
    customEndDate: searchParams.get('endDate'),
    customStartDate: searchParams.get('startDate'),
    period: searchParams.get('period') || 'month',
    provider: searchParams.get('provider') || 'gemini',
  }
}

export function getDateRange(params: AnalyticsRequestParams): AnalyticsDateRange {
  if (params.customStartDate && params.customEndDate) {
    return {
      endDate: new Date(params.customEndDate),
      startDate: new Date(params.customStartDate),
    }
  }

  const now = new Date()
  const endDate = new Date(now)
  endDate.setUTCHours(23, 59, 59, 999)

  const startDate = new Date(now)
  const daysByPeriod: Record<string, number> = {
    day: 0,
    month: 29,
    week: 6,
    year: 364,
  }

  startDate.setUTCDate(startDate.getUTCDate() - (daysByPeriod[params.period] ?? 29))
  startDate.setUTCHours(0, 0, 0, 0)

  return { endDate, startDate }
}
