import type { DateRange } from './types'

const DEFAULT_PERIOD = 'month'
const ALLOWED_PERIODS = new Set(['day', 'week', 'month', 'year'])

function parseValidDate(raw: string | null): Date | null {
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getDateRange(period: string): DateRange {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setUTCHours(23, 59, 59, 999)
  const startDate = new Date(now)

  if (period === 'day') startDate.setUTCHours(0, 0, 0, 0)
  else if (period === 'week') {
    startDate.setUTCDate(startDate.getUTCDate() - 6)
    startDate.setUTCHours(0, 0, 0, 0)
  } else if (period === 'year') {
    startDate.setUTCDate(startDate.getUTCDate() - 364)
    startDate.setUTCHours(0, 0, 0, 0)
  } else {
    startDate.setUTCDate(startDate.getUTCDate() - 29)
    startDate.setUTCHours(0, 0, 0, 0)
  }

  return { startDate, endDate }
}

export function resolveAnalyticsRange(searchParams: URLSearchParams) {
  const rawPeriod = searchParams.get('period') || DEFAULT_PERIOD
  const period = ALLOWED_PERIODS.has(rawPeriod) ? rawPeriod : DEFAULT_PERIOD

  const customStartDate = parseValidDate(searchParams.get('startDate'))
  const customEndDate = parseValidDate(searchParams.get('endDate'))

  if (customStartDate && customEndDate) {
    return { period, startDate: customStartDate, endDate: customEndDate }
  }
  return { period, ...getDateRange(period) }
}

export function getUtcDateKey(value: string | Date) {
  if (typeof value === 'string') {
    if (value.includes(' ')) return value.split(' ')[0]
    if (value.includes('T')) return value.split('T')[0]
  }

  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
