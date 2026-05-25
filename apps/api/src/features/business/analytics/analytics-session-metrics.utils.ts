import type {
  AnalyticsDurationPoint,
  AnalyticsHeatmapPoint,
  AnalyticsOrganizationUserRecord,
  AnalyticsStudySessionRecord,
} from './analytics.types'
import { roundToWhole } from './analytics-math.utils'

export function calculateHeatmap(
  studySessions: AnalyticsStudySessionRecord[],
): AnalyticsHeatmapPoint[] {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const ranges = new Map<string, number>()

  for (const session of studySessions) {
    if (!session.start_time) continue
    const date = new Date(session.start_time)
    if (Number.isNaN(date.getTime())) continue

    const key = `${dayNames[date.getUTCDay()]}_${getHourRange(date)}`
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
  const roleByUser = new Map(
    orgUsers.map((user) => [user.user_id, user.job_title || user.role || 'member']),
  )
  const durationsByRole = new Map<string, number[]>()

  for (const session of studySessions) {
    if (!session.actual_duration_minutes || session.actual_duration_minutes <= 0) {
      continue
    }

    const role = roleByUser.get(session.user_id) || 'member'
    const durations = durationsByRole.get(role) ?? []
    durations.push(session.actual_duration_minutes)
    durationsByRole.set(role, durations)
  }

  return Array.from(durationsByRole.entries()).map(([role, durations]) => {
    const sorted = [...durations].sort((left, right) => left - right)
    return {
      role,
      median: roundToWhole(sorted[Math.floor(sorted.length / 2)] ?? 0),
      max: roundToWhole(sorted[sorted.length - 1] ?? 0),
      count: durations.length,
    }
  })
}

function getHourRange(date: Date) {
  const hour = date.getUTCHours()
  if (hour >= 21) return '21-24'
  if (hour >= 18) return '18-21'
  if (hour >= 15) return '15-18'
  if (hour >= 12) return '12-15'
  if (hour >= 9) return '09-12'
  return '06-09'
}
