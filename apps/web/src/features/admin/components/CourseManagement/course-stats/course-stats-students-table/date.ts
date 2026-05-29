export function formatCourseStatsDate(
  value: string | null | undefined,
  includeTime: boolean,
  locale: string,
  emptyLabel: string,
) {
  if (!value) {
    return includeTime ? emptyLabel : '--'
  }

  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
