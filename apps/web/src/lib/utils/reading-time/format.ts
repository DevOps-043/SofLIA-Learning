export function formatReadingTime(estimatedMinutes: number): string {
  if (estimatedMinutes < 60) {
    return `~${estimatedMinutes} min`
  }

  const hours = Math.floor(estimatedMinutes / 60)
  const mins = estimatedMinutes % 60

  return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`
}
