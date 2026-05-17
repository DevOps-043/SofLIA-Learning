import type { CalendarDay, DatePickerViewDate } from './types'

export function getInitialViewDate(value: string): DatePickerViewDate {
  if (value) {
    const date = new Date(`${value}T00:00:00`)
    return { year: date.getFullYear(), month: date.getMonth() }
  }

  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function getCalendarDays(viewDate: DatePickerViewDate): CalendarDay[] {
  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month)
  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay()
  const daysInPrevMonth = getDaysInMonth(viewDate.year, viewDate.month - 1)
  const days: CalendarDay[] = []

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index
    days.push({ day, month: 'prev', date: new Date(viewDate.year, viewDate.month - 1, day) })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ day, month: 'current', date: new Date(viewDate.year, viewDate.month, day) })
  }

  for (let day = 1; days.length < 42; day += 1) {
    days.push({ day, month: 'next', date: new Date(viewDate.year, viewDate.month + 1, day) })
  }

  return days
}

export function isDateOutsideBounds(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate) {
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    if (date < min) return true
  }

  if (maxDate) {
    const max = new Date(maxDate)
    max.setHours(23, 59, 59, 999)
    if (date > max) return true
  }

  return false
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(value: string, locale: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(resolveLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getMonthLabel(viewDate: DatePickerViewDate, locale: string): string {
  const date = new Date(Date.UTC(viewDate.year, viewDate.month, 1))
  return new Intl.DateTimeFormat(resolveLocale(locale), { month: 'long', timeZone: 'UTC' }).format(date)
}

export function getWeekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), { timeZone: 'UTC', weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(Date.UTC(2026, 7, 2 + index))))
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function resolveLocale(locale: string): string {
  if (locale.startsWith('en')) return 'en-US'
  if (locale.startsWith('pt')) return 'pt-BR'
  return 'es-ES'
}
