import type {
  AnalyticsDailyProgressRecord,
  AnalyticsFrequencyPoint,
  AnalyticsStickinessPoint,
} from './analytics.types'
import { roundToWhole, sortByDateDesc } from './analytics-math.utils'

export function getLatestStreak(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return (
    sortByDateDesc(userDailyProgress, (entry) => entry.progress_date)[0]
      ?.streak_count ?? 0
  )
}

export function getLastActive(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return (
    sortByDateDesc(userDailyProgress, (entry) => entry.progress_date).find(
      (entry) => entry.had_activity,
    )?.progress_date ?? null
  )
}

export function calculateStickiness(
  dailyProgress: AnalyticsDailyProgressRecord[],
): AnalyticsStickinessPoint[] {
  if (dailyProgress.length === 0) return []

  const weeks = new Map<string, Set<string>>()
  const monthUsers = new Set<string>()

  for (const entry of dailyProgress) {
    if (!entry.had_activity) continue
    monthUsers.add(entry.user_id)

    const date = new Date(entry.progress_date)
    if (Number.isNaN(date.getTime())) continue

    const weekStart = new Date(date)
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    const weekUsers = weeks.get(weekKey) ?? new Set<string>()
    weekUsers.add(entry.user_id)
    weeks.set(weekKey, weekUsers)
  }

  const mau = monthUsers.size

  return Array.from(weeks.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([week, users]) => ({
      name: new Date(week).toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric',
      }),
      dau: users.size,
      mau,
      ratio: mau > 0 ? roundToWhole((users.size / mau) * 100) : 0,
    }))
}

export function calculateFrequency(
  dailyProgress: AnalyticsDailyProgressRecord[],
  activeSinceDate: string,
): AnalyticsFrequencyPoint[] {
  const daysByUser = new Map<string, number>()

  for (const entry of dailyProgress) {
    if (!entry.had_activity || entry.progress_date < activeSinceDate) continue
    daysByUser.set(entry.user_id, (daysByUser.get(entry.user_id) ?? 0) + 1)
  }

  return [
    { name: '1-2 dias', min: 1, max: 2 },
    { name: '3-5 dias', min: 3, max: 5 },
    { name: '6-10 dias', min: 6, max: 10 },
    { name: '11-20 dias', min: 11, max: 20 },
    { name: '21+ dias', min: 21, max: Number.POSITIVE_INFINITY },
  ]
    .map((range) => ({
      name: range.name,
      users: Array.from(daysByUser.values()).filter(
        (count) => count >= range.min && count <= range.max,
      ).length,
    }))
    .filter((entry) => entry.users > 0)
}
