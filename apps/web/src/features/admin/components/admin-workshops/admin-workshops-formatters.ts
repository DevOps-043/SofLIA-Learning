export function formatWorkshopDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`
}

export function getWorkshopInstructorInitials(name?: string | null): string {
  if (!name || name === 'Sin instructor') return 'SI'
  const names = name.split(' ').filter(Boolean)
  if (names.length >= 2) {
    return `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`.toUpperCase()
  }

  return name.substring(0, 2).toUpperCase()
}
