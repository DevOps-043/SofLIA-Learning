export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  result.setHours(23, 59, 59, 999)
  return result
}

export function formatDuration(days: number): string {
  if (days < 7) {
    return `${days} dÃ­a${days !== 1 ? 's' : ''}`
  }

  const weeks = Math.ceil(days / 7)
  if (weeks < 5) {
    return `${weeks} semana${weeks !== 1 ? 's' : ''}`
  }

  const months = Math.ceil(days / 30)
  return `${months} mes${months !== 1 ? 'es' : ''}`
}
