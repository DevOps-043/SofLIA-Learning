export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 60) {
    return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  }

  if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }

  return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
}
