import { toUtcDateKey } from './to-utc-date-key'

export function calculateCurrentStreak(dateKeys: string[]): number {
  const keySet = new Set(dateKeys)
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  let streak = 0

  while (keySet.has(toUtcDateKey(cursor) || '')) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}
