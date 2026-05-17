import type { ReportsAnalyticsConnectionCalendarCell } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsLocale, ThemeTokens } from './types'

export type CalendarWeek = {
  weekIndex: number
  cells: Array<ReportsAnalyticsConnectionCalendarCell | null>
}

export function buildCalendarWeeks(cells: ReportsAnalyticsConnectionCalendarCell[]): CalendarWeek[] {
  const weekMap = new Map<number, Array<ReportsAnalyticsConnectionCalendarCell | null>>()

  cells.forEach((cell) => {
    const weekCells = weekMap.get(cell.weekIndex) || Array.from(
      { length: 7 },
      () => null as ReportsAnalyticsConnectionCalendarCell | null,
    )
    weekCells[cell.dayIndex] = cell
    weekMap.set(cell.weekIndex, weekCells)
  })

  return Array.from(weekMap.entries())
    .sort(([weekA], [weekB]) => weekA - weekB)
    .map(([weekIndex, cells]) => ({ weekIndex, cells }))
}

export function buildCalendarMonthLabels(weeks: CalendarWeek[], locale: ReportsAnalyticsLocale) {
  let currentMonth = ''

  return weeks.flatMap((week) => {
    const firstCell = week.cells.find((cell): cell is ReportsAnalyticsConnectionCalendarCell => Boolean(cell))
    if (!firstCell || firstCell.monthKey === currentMonth) return []

    currentMonth = firstCell.monthKey
    return [{ weekIndex: week.weekIndex, label: formatCalendarMonth(firstCell.monthKey, locale) }]
  })
}

export function getConnectionCalendarColor(
  level: ReportsAnalyticsConnectionCalendarCell['level'],
  theme: ThemeTokens,
): string {
  if (level === 0) return theme.hoverBg
  if (level === 1) return `color-mix(in srgb, ${theme.successColor} 24%, ${theme.cardBg})`
  if (level === 2) return `color-mix(in srgb, ${theme.successColor} 46%, ${theme.cardBg})`
  if (level === 3) return `color-mix(in srgb, ${theme.successColor} 70%, ${theme.cardBg})`
  return theme.successColor
}

export function formatCalendarDate(dateKey: string, locale: ReportsAnalyticsLocale): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return dateKey
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function formatCalendarMonth(monthKey: string, locale: ReportsAnalyticsLocale): string {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return monthKey
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date)
}
