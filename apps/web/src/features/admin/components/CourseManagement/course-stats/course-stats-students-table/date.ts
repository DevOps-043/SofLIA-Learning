export function formatCourseStatsDate(
  value: string | null | undefined,
  includeTime: boolean,
) {
  if (!value) {
    return includeTime ? 'Nunca' : '--'
  }

  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
