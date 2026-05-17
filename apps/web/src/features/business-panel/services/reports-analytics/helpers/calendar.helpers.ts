import type {
  ReportsAnalyticsConnectionCalendarCell,
  ReportsAnalyticsFilters,
  ReportsAnalyticsLoginHeatmapCell,
} from '../../../types/reports-analytics.types'
import {
  getCalendarLevel,
  getCalendarWeekEnd,
  getCalendarWeekStart,
  getUtcDayStart,
  toUtcDateKey,
} from './calendar-internals.helpers'
import { REPORTS_ANALYTICS_WEEKDAYS } from './constants'
import { clampPercentage } from './number.helpers'

export function buildLoginHeatmap(
  connectionDates: Array<string | null | undefined>,
): ReportsAnalyticsLoginHeatmapCell[] {
  const counts = new Map<string, number>()
  let maxValue = 0

  connectionDates.forEach((value) => {
    if (!value) return
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return

    const key = `${date.getUTCDay()}:${date.getUTCHours()}`
    const count = (counts.get(key) || 0) + 1
    counts.set(key, count)
    maxValue = Math.max(maxValue, count)
  })

  return REPORTS_ANALYTICS_WEEKDAYS.flatMap((dayKey, dayIndex) =>
    Array.from({ length: 24 }, (_, hour) => {
      const value = counts.get(`${dayIndex}:${hour}`) || 0
      return {
        dayKey,
        dayIndex,
        hour,
        hourLabel: `${String(hour).padStart(2, '0')}:00`,
        value,
        percentage: maxValue > 0 ? clampPercentage((value / maxValue) * 100) : 0,
      }
    }),
  )
}

export function buildConnectionCalendar(
  connectionDates: Array<string | null | undefined>,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): ReportsAnalyticsConnectionCalendarCell[] {
  const from = getUtcDayStart(filters.from)
  const to = getUtcDayStart(filters.to)
  if (!from || !to || from > to) return []

  const counts = buildConnectionCounts(connectionDates, from, to)
  const maxValue = Math.max(0, ...Array.from(counts.values()))
  const start = getCalendarWeekStart(from)
  const end = getCalendarWeekEnd(to)
  const cells: ReportsAnalyticsConnectionCalendarCell[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    const dateKey = toUtcDateKey(cursor)
    const value = counts.get(dateKey) || 0
    const monthKey = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`

    cells.push({
      date: dateKey,
      dayKey: REPORTS_ANALYTICS_WEEKDAYS[cursor.getUTCDay()],
      dayIndex: cursor.getUTCDay(),
      weekIndex: Math.floor((cursor.getTime() - start.getTime()) / 604_800_000),
      monthKey,
      monthLabel: monthKey,
      value,
      level: getCalendarLevel(value, maxValue),
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return cells
}

function buildConnectionCounts(
  connectionDates: Array<string | null | undefined>,
  from: Date,
  to: Date,
): Map<string, number> {
  const counts = new Map<string, number>()

  connectionDates.forEach((value) => {
    const date = getUtcDayStart(value)
    if (!date || date < from || date > to) return

    const key = toUtcDateKey(date)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return counts
}
