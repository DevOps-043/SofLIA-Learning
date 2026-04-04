export function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

export function roundToWhole(value: number) {
  return Math.round(value)
}

export function sortByDateDesc<T>(items: T[], valueSelector: (item: T) => string | null) {
  return [...items].sort((left, right) => {
    const leftDate = valueSelector(left)
    const rightDate = valueSelector(right)
    return new Date(rightDate || 0).getTime() - new Date(leftDate || 0).getTime()
  })
}

export function csvEscape(value: string | number | null | undefined) {
  const normalizedValue = value == null ? '' : String(value)
  const escapedValue = normalizedValue.replace(/"/g, '""')
  return `"${escapedValue}"`
}
