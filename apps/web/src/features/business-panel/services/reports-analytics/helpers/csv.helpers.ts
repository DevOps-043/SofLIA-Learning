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
