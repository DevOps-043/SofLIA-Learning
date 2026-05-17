export function getDateInputValue(dateIso?: string): string {
  if (!dateIso) {
    return ''
  }

  const parsedDate = new Date(dateIso)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const year = parsedDate.getFullYear()
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsedDate.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toEndOfDayIso(dateValue: string): string {
  const selectedDate = new Date(`${dateValue}T23:59:59.999`)
  return selectedDate.toISOString()
}

export function normalizeLiaSuggestedDate(dateValue?: string | null): string | null {
  if (!dateValue) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return toEndOfDayIso(dateValue)
  }

  const parsedDate = new Date(dateValue)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString()
}
