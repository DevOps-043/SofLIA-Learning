export function getCalendarLevel(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || maxValue <= 0) return 0
  const ratio = value / maxValue
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function getUtcDayStart(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ))
}

export function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getCalendarWeekStart(from: Date): Date {
  const start = new Date(from)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  return start
}

export function getCalendarWeekEnd(to: Date): Date {
  const end = new Date(to)
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()))
  return end
}
