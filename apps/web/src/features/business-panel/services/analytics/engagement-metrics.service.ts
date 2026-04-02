import type {
  BusinessAnalyticsDurationPoint,
  BusinessAnalyticsFrequencyPoint,
  BusinessAnalyticsHeatmapPoint,
  BusinessAnalyticsStickinessPoint,
  BusinessAnalyticsStreakPoint,
} from '../../types/analytics.types'

export interface AnalyticsDailyProgressRecord {
  user_id: string
  progress_date: string
  had_activity: boolean | null
  streak_count: number | null
  study_minutes: number | null
}

export interface AnalyticsStudySessionRecord {
  user_id: string
  start_time: string | null
  actual_duration_minutes: number | null
}

export interface AnalyticsOrganizationUserRoleRecord {
  user_id: string
  role: string | null
  job_title: string | null
}

export function calculateStickiness(
  dailyProgress: AnalyticsDailyProgressRecord[],
): BusinessAnalyticsStickinessPoint[] {
  if (dailyProgress.length === 0) return []

  const weeks: Record<string, Set<string>> = {}
  const monthUsers = new Set<string>()

  dailyProgress.forEach((entry) => {
    if (!entry.had_activity) return

    monthUsers.add(entry.user_id)

    const date = new Date(entry.progress_date)
    if (Number.isNaN(date.getTime())) return

    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeks[weekKey]) {
      weeks[weekKey] = new Set()
    }

    weeks[weekKey].add(entry.user_id)
  })

  const mau = monthUsers.size

  return Object.entries(weeks)
    .sort(([leftWeek], [rightWeek]) => leftWeek.localeCompare(rightWeek))
    .slice(-12)
    .map(([week, users]) => {
      const dau = users.size

      return {
        name: new Date(week).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        dau,
        mau,
        ratio: mau > 0 ? Math.round((dau / mau) * 100) : 0,
      }
    })
}

export function calculateFrequency(
  dailyProgress: AnalyticsDailyProgressRecord[],
  thirtyDaysAgoStr: string,
): BusinessAnalyticsFrequencyPoint[] {
  const userDayCount: Record<string, number> = {}

  dailyProgress.forEach((entry) => {
    if (!entry.had_activity || entry.progress_date < thirtyDaysAgoStr) return

    userDayCount[entry.user_id] = (userDayCount[entry.user_id] || 0) + 1
  })

  return [
    { name: '1-2 días', min: 1, max: 2 },
    { name: '3-5 días', min: 3, max: 5 },
    { name: '6-10 días', min: 6, max: 10 },
    { name: '11-20 días', min: 11, max: 20 },
    { name: '21+ días', min: 21, max: Infinity },
  ]
    .map((range) => ({
      name: range.name,
      users: Object.values(userDayCount).filter(
        (count) => count >= range.min && count <= range.max,
      ).length,
    }))
    .filter((entry) => entry.users > 0)
}

export function calculateStreaks(
  dailyProgress: AnalyticsDailyProgressRecord[],
  userIds: string[],
): BusinessAnalyticsStreakPoint[] {
  const userStreaks: Record<string, number> = {}
  userIds.forEach((userId) => {
    userStreaks[userId] = 0
  })

  dailyProgress.forEach((entry) => {
    if (!(entry.user_id in userStreaks)) return

    if (userStreaks[entry.user_id] === 0 && (entry.streak_count || 0) > 0) {
      userStreaks[entry.user_id] = entry.streak_count || 0
    }
  })

  const streakValues = Object.values(userStreaks)
  const total = streakValues.length || 1

  const noStreak = streakValues.filter((value) => value === 0).length
  const short = streakValues.filter((value) => value >= 1 && value <= 3).length
  const medium = streakValues.filter((value) => value >= 4 && value <= 7).length
  const long = streakValues.filter((value) => value > 7).length

  return [
    { name: 'Sin racha', value: Math.round((noStreak / total) * 100), fill: '#EF4444' },
    { name: '1-3 días', value: Math.round((short / total) * 100), fill: '#F59E0B' },
    { name: '4-7 días', value: Math.round((medium / total) * 100), fill: '#3B82F6' },
    { name: '7+ días', value: Math.round((long / total) * 100), fill: '#10B981' },
  ]
}

export function calculateHeatmap(
  studySessions: AnalyticsStudySessionRecord[],
): BusinessAnalyticsHeatmapPoint[] {
  if (studySessions.length === 0) return []

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const matrix: Record<string, number> = {}

  studySessions.forEach((session) => {
    if (!session.start_time) return

    const date = new Date(session.start_time)
    if (Number.isNaN(date.getTime())) return

    const day = days[date.getDay()]
    const hour = date.getHours()

    let hourRange = '6-9'
    if (hour >= 21) hourRange = '21-24'
    else if (hour >= 18) hourRange = '18-21'
    else if (hour >= 15) hourRange = '15-18'
    else if (hour >= 12) hourRange = '12-15'
    else if (hour >= 9) hourRange = '9-12'

    const key = `${day}_${hourRange}`
    matrix[key] = (matrix[key] || 0) + 1
  })

  return Object.entries(matrix).map(([key, value]) => {
    const [day, hour] = key.split('_')

    return { day, hour, value }
  })
}

export function calculateDuration(
  studySessions: AnalyticsStudySessionRecord[],
  orgUsers: AnalyticsOrganizationUserRoleRecord[],
): BusinessAnalyticsDurationPoint[] {
  if (studySessions.length === 0) return []

  const userRoles: Record<string, string> = {}
  orgUsers.forEach((user) => {
    userRoles[user.user_id] = user.job_title || user.role || 'member'
  })

  const roleDurations: Record<string, number[]> = {}

  studySessions.forEach((session) => {
    if (!session.actual_duration_minutes || session.actual_duration_minutes <= 0) return

    const role = userRoles[session.user_id] || 'member'
    if (!roleDurations[role]) {
      roleDurations[role] = []
    }

    roleDurations[role].push(session.actual_duration_minutes)
  })

  return Object.entries(roleDurations).map(([role, durations]) => {
    const sortedDurations = [...durations].sort((left, right) => left - right)
    const median =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length / 2)]
        : 0
    const max =
      sortedDurations.length > 0 ? sortedDurations[sortedDurations.length - 1] : 0

    return {
      role,
      median: Math.round(median),
      max: Math.round(max),
      count: durations.length,
    }
  })
}
