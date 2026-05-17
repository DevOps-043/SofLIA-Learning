export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateForDisplay(value: string): string {
  const date = parseDateOnly(value)
  if (!date) return ''

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('/')
}

export function parseDisplayDate(value: string): string | null {
  const trimmedValue = value.trim()
  const displayMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmedValue)

  if (displayMatch) {
    const day = displayMatch[1].padStart(2, '0')
    const month = displayMatch[2].padStart(2, '0')
    const dateOnly = `${displayMatch[3]}-${month}-${day}`
    return parseDateOnly(dateOnly) ? dateOnly : null
  }

  return parseDateOnly(trimmedValue) ? trimmedValue : null
}

export function isDateWithinRange(value: string, min?: string, max?: string): boolean {
  return Boolean(parseDateOnly(value)) && (!min || value >= min) && (!max || value <= max)
}

export function buildCalendarDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    return date
  })
}
