export function isDateOnOrBefore(
  value: string | null | undefined,
  to: string,
): boolean {
  if (!value) return false

  const date = new Date(value)
  const endDate = new Date(to)
  if (Number.isNaN(date.getTime()) || Number.isNaN(endDate.getTime())) {
    return false
  }

  return date <= endDate
}

export function isAnyDateOnOrBefore(
  values: Array<string | null | undefined>,
  to: string,
): boolean {
  return values.some((value) => isDateOnOrBefore(value, to))
}

export function getLatestDate(
  values: Array<string | null | undefined>,
): string | null {
  const latest = values.reduce<Date | null>((current, value) => {
    if (!value) return current
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return current
    return !current || date > current ? date : current
  }, null)

  return latest ? latest.toISOString() : null
}
