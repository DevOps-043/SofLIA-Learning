import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsConnectionCalendarCell,
  ReportsAnalyticsFilters,
  ReportsAnalyticsLoginHeatmapCell,
  ReportsAnalyticsTimeGranularity,
  ReportsAnalyticsTrendPoint,
} from '../../types/reports-analytics.types'

export const REPORTS_ANALYTICS_UNSPECIFIED = 'unspecified'

export const REPORTS_ANALYTICS_AGE_BANDS = [
  'under_18',
  '18_24',
  '25_34',
  '35_44',
  '45_54',
  '55_plus',
  REPORTS_ANALYTICS_UNSPECIFIED,
] as const

export const REPORTS_ANALYTICS_PROGRESS_BANDS = [
  'not_started',
  'low',
  'medium',
  'high',
  'almost_done',
  'completed',
] as const

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

export function calculatePercentage(value: number, total: number): number {
  if (!total) return 0
  return clampPercentage((value / total) * 100)
}

export function calculateAverage(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value))
  if (validValues.length === 0) return 0
  return Math.round((validValues.reduce((sum, value) => sum + value, 0) / validValues.length) * 10) / 10
}

export function calculateMedian(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (validValues.length === 0) return 0

  const midpoint = Math.floor(validValues.length / 2)
  const median = validValues.length % 2
    ? validValues[midpoint]
    : (validValues[midpoint - 1] + validValues[midpoint]) / 2

  return Math.round(median * 10) / 10
}

export function calculateDaysBetween(
  startValue: string | null | undefined,
  endValue: string | null | undefined,
): number | null {
  if (!startValue || !endValue) return null

  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null

  const days = (end.getTime() - start.getTime()) / 86_400_000
  return Math.max(0, Math.round(days * 10) / 10)
}

export function calculateAge(dateOfBirth: string | null | undefined, today = new Date()): number | null {
  if (!dateOfBirth) return null

  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`)
  if (Number.isNaN(birthDate.getTime())) return null

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth()
  const dayDiff = today.getUTCDate() - birthDate.getUTCDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function getAgeBand(age: number | null): string {
  if (age === null) return REPORTS_ANALYTICS_UNSPECIFIED
  if (age < 18) return 'under_18'
  if (age <= 24) return '18_24'
  if (age <= 34) return '25_34'
  if (age <= 44) return '35_44'
  if (age <= 54) return '45_54'
  return '55_plus'
}

export function getProgressBand(progress: number): string {
  if (progress >= 100) return 'completed'
  if (progress >= 76) return 'almost_done'
  if (progress >= 51) return 'high'
  if (progress >= 26) return 'medium'
  if (progress > 0) return 'low'
  return 'not_started'
}

export function normalizeDimension(value: string | null | undefined): string {
  const normalized = value?.trim()
  return normalized ? normalized : REPORTS_ANALYTICS_UNSPECIFIED
}

export function resolveLastConnectionAt(
  lastLoginAt: string | null | undefined,
  updatedAt: string | null | undefined,
): string | null {
  return lastLoginAt || updatedAt || null
}

export function isDateWithinPeriod(
  value: string | null | undefined,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): boolean {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date >= new Date(filters.from) && date <= new Date(filters.to)
}

export function isAnyDateWithinPeriod(
  values: Array<string | null | undefined>,
  filters: Pick<ReportsAnalyticsFilters, 'from' | 'to'>,
): boolean {
  return values.some((value) => isDateWithinPeriod(value, filters))
}

export function isDateOnOrBefore(
  value: string | null | undefined,
  to: string,
): boolean {
  if (!value) return false

  const date = new Date(value)
  const endDate = new Date(to)
  if (Number.isNaN(date.getTime()) || Number.isNaN(endDate.getTime())) return false

  return date <= endDate
}

export function isAnyDateOnOrBefore(
  values: Array<string | null | undefined>,
  to: string,
): boolean {
  return values.some((value) => isDateOnOrBefore(value, to))
}

export function getLatestDate(values: Array<string | null | undefined>): string | null {
  const latest = values.reduce<Date | null>((current, value) => {
    if (!value) return current
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return current
    if (!current || date > current) return date
    return current
  }, null)

  return latest ? latest.toISOString() : null
}

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

export function incrementMap(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) || 0) + amount)
}

export const REPORTS_ANALYTICS_WEEKDAYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const

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

  const counts = new Map<string, number>()
  connectionDates.forEach((value) => {
    const date = getUtcDayStart(value)
    if (!date || date < from || date > to) return
    const key = toUtcDateKey(date)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const maxValue = Math.max(0, ...Array.from(counts.values()))
  const start = new Date(from)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  const end = new Date(to)
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()))

  const cells: ReportsAnalyticsConnectionCalendarCell[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    const dateKey = toUtcDateKey(cursor)
    const value = counts.get(dateKey) || 0
    const month = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    const monthKey = `${cursor.getUTCFullYear()}-${month}`

    cells.push({
      date: dateKey,
      dayKey: REPORTS_ANALYTICS_WEEKDAYS[cursor.getUTCDay()],
      dayIndex: cursor.getUTCDay(),
      weekIndex: Math.floor((cursor.getTime() - start.getTime()) / (7 * 86_400_000)),
      monthKey,
      monthLabel: monthKey,
      value,
      level: getCalendarLevel(value, maxValue),
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return cells
}

function getCalendarLevel(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || maxValue <= 0) return 0
  const ratio = value / maxValue
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function getUtcDayStart(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function calculateQualityScore(parts: Array<number | null | undefined>): number {
  return clampPercentage(calculateAverage(parts.filter((value): value is number => Number.isFinite(value))))
}

export function calculateRankScore(input: {
  averageProgress: number
  completionRate: number
  sofliaAdoptionRate: number
  notesAdoptionRate: number
  qualityScore: number
  overdueAssignments: number
  users: number
}): number {
  const overduePenalty = input.users > 0
    ? Math.min(20, (input.overdueAssignments / input.users) * 5)
    : 0

  return clampPercentage(
    input.averageProgress * 0.25 +
      input.completionRate * 0.25 +
      input.qualityScore * 0.2 +
      input.sofliaAdoptionRate * 0.15 +
      input.notesAdoptionRate * 0.15 -
      overduePenalty,
  )
}

export function buildMonthKey(value: string): string {
  return buildPeriodKey(value, 'month')
}

export function buildPeriodKey(value: string, granularity: ReportsAnalyticsTimeGranularity): string {
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
    return buildBreakdown(counts, Array.from(counts.values()).reduce((sum, value) => sum + value, 0))
  }

  const cursor = getPeriodStart(from, filters.granularity)
  const end = getPeriodStart(to, filters.granularity)

  while (cursor <= end) {
    const key = buildPeriodKey(cursor.toISOString(), filters.granularity)
    points.push({
      key,
      label: key,
      value: counts.get(key) || 0,
    })
    incrementPeriodCursor(cursor, filters.granularity)
  }

  return points
}

function getPeriodStart(date: Date, granularity: ReportsAnalyticsTimeGranularity): Date {
  if (granularity === 'day') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  }

  if (granularity === 'year') {
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function incrementPeriodCursor(date: Date, granularity: ReportsAnalyticsTimeGranularity): void {
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

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (!/[",\n\r]/.test(stringValue)) return stringValue
  return `"${stringValue.replace(/"/g, '""')}"`
}

export function buildCsv<T extends object>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(','),
  )

  return [header, ...body].join('\n')
}
