export function isToday(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const today = new Date()

    return (
      date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear()
    )
  } catch {
    return false
  }
}

export function isWithinDays(dateString: string, days: number): boolean {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return diffDays <= days && diffDays >= 0
  } catch {
    return false
  }
}
