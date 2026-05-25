import type {
  AnalyticsDailyProgressRecord,
  AnalyticsStreakPoint,
} from './analytics.types'
import { roundToWhole } from './analytics-math.utils'

export function calculateStreaks(
  dailyProgress: AnalyticsDailyProgressRecord[],
  userIds: string[],
): AnalyticsStreakPoint[] {
  const streaksByUser = new Map<string, number>()
  for (const userId of userIds) streaksByUser.set(userId, 0)

  for (const entry of dailyProgress) {
    if (!streaksByUser.has(entry.user_id)) continue
    if ((streaksByUser.get(entry.user_id) ?? 0) === 0) {
      streaksByUser.set(entry.user_id, entry.streak_count ?? 0)
    }
  }

  const streakValues = Array.from(streaksByUser.values())
  const total = streakValues.length || 1

  return [
    ratio('Sin racha', streakValues.filter((value) => value === 0).length, total),
    ratio('1-3 dias', streakValues.filter(inRange(1, 3)).length, total),
    ratio('4-7 dias', streakValues.filter(inRange(4, 7)).length, total),
    ratio('8+ dias', streakValues.filter((value) => value >= 8).length, total),
  ]
}

function inRange(min: number, max: number) {
  return (value: number) => value >= min && value <= max
}

function ratio(name: string, count: number, total: number) {
  return { name, value: roundToWhole((count / total) * 100) }
}
