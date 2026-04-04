import type {
  AnalyticsDailyProgressRecord,
  AnalyticsDurationPoint,
  AnalyticsFrequencyPoint,
  AnalyticsHeatmapPoint,
  AnalyticsOrganizationUserRecord,
  AnalyticsStickinessPoint,
  AnalyticsStreakPoint,
  AnalyticsStudySessionRecord,
} from './analytics.types'
import { roundToWhole, sortByDateDesc } from './analytics-math.utils'

export function getLatestStreak(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return (
    sortByDateDesc(userDailyProgress, entry => entry.progress_date)[0]?.streak_count ?? 0
  )
}

export function getLastActive(userDailyProgress: AnalyticsDailyProgressRecord[]) {
  return (
    sortByDateDesc(userDailyProgress, entry => entry.progress_date).find(
      entry => entry.had_activity,
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
      name: new Date(week).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
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
    .map(range => ({
      name: range.name,
      users: Array.from(daysByUser.values()).filter(
        count => count >= range.min && count <= range.max,
      ).length,
    }))
    .filter(entry => entry.users > 0)
}

export function calculateStreaks(
  dailyProgress: AnalyticsDailyProgressRecord[],
  userIds: string[],
): AnalyticsStreakPoint[] {
  const streaksByUser = new Map<string, number>()
  for (const userId of userIds) streaksByUser.set(userId, 0)

  for (const entry of dailyProgress) {
    if (!streaksByUser.has(entry.user_id)) continue
    if ((streaksByUser.get(entry.user_id) ?? 0) === 0 && (entry.streak_count ?? 0) > 0) {
      streaksByUser.set(entry.user_id, entry.streak_count ?? 0)
    }
  }

  const streakValues = Array.from(streaksByUser.values())
  const total = streakValues.length || 1

  return [
    { name: 'Sin racha', value: roundToWhole((streakValues.filter(v => v === 0).length / total) * 100) },
    { name: '1-3 dias', value: roundToWhole((streakValues.filter(v => v >= 1 && v <= 3).length / total) * 100) },
    { name: '4-7 dias', value: roundToWhole((streakValues.filter(v => v >= 4 && v <= 7).length / total) * 100) },
    { name: '8+ dias', value: roundToWhole((streakValues.filter(v => v >= 8).length / total) * 100) },
  ]
}

export function calculateHeatmap(
  studySessions: AnalyticsStudySessionRecord[],
): AnalyticsHeatmapPoint[] {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const ranges = new Map<string, number>()

  for (const session of studySessions) {
    if (!session.start_time) continue
    const date = new Date(session.start_time)
    if (Number.isNaN(date.getTime())) continue
    const hour = date.getUTCHours()
    let range = '06-09'
    if (hour >= 21) range = '21-24'
    else if (hour >= 18) range = '18-21'
    else if (hour >= 15) range = '15-18'
    else if (hour >= 12) range = '12-15'
    else if (hour >= 9) range = '09-12'
    const key = `${dayNames[date.getUTCDay()]}_${range}`
    ranges.set(key, (ranges.get(key) ?? 0) + 1)
  }

  return Array.from(ranges.entries()).map(([key, value]) => {
    const [day, hour] = key.split('_')
    return { day, hour, value }
  })
}

export function calculateDuration(
  studySessions: AnalyticsStudySessionRecord[],
  orgUsers: AnalyticsOrganizationUserRecord[],
): AnalyticsDurationPoint[] {
  const roleByUser = new Map<string, string>()
  for (const user of orgUsers) {
    roleByUser.set(user.user_id, user.job_title || user.role || 'member')
  }

  const durationsByRole = new Map<string, number[]>()

  for (const session of studySessions) {
    if (!session.actual_duration_minutes || session.actual_duration_minutes <= 0) continue
    const role = roleByUser.get(session.user_id) || 'member'
    const durations = durationsByRole.get(role) ?? []
    durations.push(session.actual_duration_minutes)
    durationsByRole.set(role, durations)
  }

  return Array.from(durationsByRole.entries()).map(([role, durations]) => {
    const sorted = [...durations].sort((l, r) => l - r)
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0
    const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0
    return { role, median: roundToWhole(median), max: roundToWhole(max), count: durations.length }
  })
}
