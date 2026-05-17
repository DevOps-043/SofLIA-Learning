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
