import type {
  BusinessAnalyticsActivityCalendarEntry,
  BusinessAnalyticsTeam,
  BusinessAnalyticsUser,
} from '../types/analytics.types'

export interface BusinessAnalyticsActivityWeekDay {
  date: string
  count: number
  level: number
  isFuture: boolean
}

export interface BusinessAnalyticsTeamSummary {
  totalMembers: number
  totalLiaChats: number
  bestTeamName: string
  bestTeamProgress: number
}

export function getBusinessAnalyticsUserDisplayName(
  user: Partial<BusinessAnalyticsUser>,
  fallbackLabel: string,
): string {
  return (
    user.name ||
    user.display_name ||
    (user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : null) ||
    user.first_name ||
    user.username ||
    user.email?.split('@')[0] ||
    fallbackLabel
  )
}

export function getBusinessAnalyticsUserInitials(
  user: Partial<BusinessAnalyticsUser>,
  fallbackLabel: string,
): string {
  const displayName = getBusinessAnalyticsUserDisplayName(user, fallbackLabel)

  if (displayName && displayName !== fallbackLabel) {
    return displayName.charAt(0).toUpperCase()
  }

  return user.email?.charAt(0).toUpperCase() || '?'
}

export function getBusinessAnalyticsUserRoleTone(
  role: string | null | undefined,
): 'admin' | 'instructor' | 'member' {
  const normalizedRole = role?.toLowerCase() || ''

  if (normalizedRole.includes('admin')) {
    return 'admin'
  }

  if (normalizedRole.includes('instructor')) {
    return 'instructor'
  }

  return 'member'
}

export function getBusinessAnalyticsProgressColor(progress: number): string {
  if (progress >= 75) return '#10b981'
  if (progress >= 40) return '#f59e0b'
  return '#ef4444'
}

export function getBusinessAnalyticsStudyHours(totalMinutes: number): number {
  return Math.round((totalMinutes / 60) * 10) / 10
}

export function getBusinessAnalyticsHeatmapColor(level: number): string {
  if (!level) return 'bg-gray-200 dark:bg-white/5'
  if (level === 1) return 'bg-emerald-500/20'
  if (level === 2) return 'bg-emerald-500/40'
  if (level === 3) return 'bg-emerald-500/60'
  return 'bg-emerald-500'
}

export function getBusinessAnalyticsMaxHour(hourlyDistribution: number[] | undefined): number {
  if (!hourlyDistribution || hourlyDistribution.length === 0) {
    return 1
  }

  return Math.max(...hourlyDistribution)
}

export function getBusinessAnalyticsRelativeBarWidth(
  value: number,
  maxValue: number,
): number {
  if (maxValue <= 0) return 0
  return (value / maxValue) * 100
}

export function getBusinessAnalyticsCompletionWidth(
  completed: number,
  total: number,
): number {
  if (total <= 0) return 0
  return (completed / total) * 100
}

export function getBusinessAnalyticsTeamSummary(
  teams: BusinessAnalyticsTeam[] | undefined,
  ranking: BusinessAnalyticsTeam[] | undefined,
): BusinessAnalyticsTeamSummary {
  const totalMembers =
    teams?.reduce((sum, team) => sum + (team.member_count || 0), 0) || 0
  const totalLiaChats =
    teams?.reduce((sum, team) => sum + (team.stats?.lia_conversations || 0), 0) || 0

  return {
    totalMembers,
    totalLiaChats,
    bestTeamName: ranking?.[0]?.name || '-',
    bestTeamProgress: ranking?.[0]?.stats?.average_progress || 0,
  }
}

export function buildBusinessAnalyticsActivityWeeks(
  activityCalendar: BusinessAnalyticsActivityCalendarEntry[] | undefined,
  today: Date = new Date(),
  weeksToDisplay: number = 26,
): BusinessAnalyticsActivityWeekDay[][] {
  const activityByDate = new Map<string, BusinessAnalyticsActivityCalendarEntry>()
  activityCalendar?.forEach((entry) => {
    activityByDate.set(entry.date, entry)
  })

  const startDate = new Date(today)
  startDate.setDate(today.getDate() - weeksToDisplay * 7)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const weeks: BusinessAnalyticsActivityWeekDay[][] = []
  let cursor = new Date(startDate)

  for (let weekIndex = 0; weekIndex < weeksToDisplay; weekIndex++) {
    const days: BusinessAnalyticsActivityWeekDay[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = new Date(cursor)
      const dateKey = date.toISOString().split('T')[0]
      const activity = activityByDate.get(dateKey)

      days.push({
        date: dateKey,
        count: activity?.count || 0,
        level: activity?.level || 0,
        isFuture: date > today,
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    weeks.push(days)
  }

  return weeks
}
