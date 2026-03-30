/**
 * Formats duration in minutes to a human-readable string.
 * - Less than 60 min: "X min"
 * - 60 min or more: "Xh Ym" or "Xh" for exact hours
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}
