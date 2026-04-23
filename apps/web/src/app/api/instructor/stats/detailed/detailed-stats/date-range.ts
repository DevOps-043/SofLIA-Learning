import { DEFAULT_PERIOD } from './constants'

const PERIOD_MONTH_OFFSETS = {
  '1month': 1,
  '3months': 3,
  '6months': 6,
} as const

export function getDateRange(period: string) {
  const endDate = new Date()
  if (period === '1year') {
    return {
      startDate: new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1),
      endDate,
    }
  }

  const monthsBack =
    PERIOD_MONTH_OFFSETS[period as keyof typeof PERIOD_MONTH_OFFSETS] ??
    PERIOD_MONTH_OFFSETS[DEFAULT_PERIOD as keyof typeof PERIOD_MONTH_OFFSETS]

  return {
    startDate: new Date(endDate.getFullYear(), endDate.getMonth() - monthsBack, 1),
    endDate,
  }
}

export function getDayKey(value: string | Date) {
  return new Date(value).toISOString().split('T')[0]
}
