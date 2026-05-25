import type { BusinessUser } from './businessUsers.service'
import type {
  BusinessUserStatsCompletedByMonthPoint,
  BusinessUserStatsCourseData,
  BusinessUserStatsData,
  BusinessUserStatsTabId,
} from '../types/business-user-stats.types'

export interface BusinessUserStatsTabDefinition {
  id: BusinessUserStatsTabId
  label: string
}

export interface BusinessUserStatsCompletionBar {
  month: string
  count: number
  percentage: number
}

export function getBusinessUserStatsDisplayName(user: BusinessUser | null): string {
  if (!user) return ''

  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  )
}

export function getBusinessUserStatsInitials(user: BusinessUser | null): string {
  if (!user) return 'U'

  return (user.first_name?.[0] || user.username[0] || 'U').toUpperCase()
}

export function getBusinessUserStatsRoleTranslationKey(
  role: BusinessUser['org_role'],
): string {
  if (role === 'owner') return 'users.roles.owner'
  if (role === 'admin') return 'users.roles.admin'
  return 'users.roles.member'
}

export function getBusinessUserStatsCourseProgressColor(
  course: Pick<BusinessUserStatsCourseData, 'status' | 'progress'>,
): string {
  if (course.status === 'completed') return 'var(--color-success)'
  if (course.progress > 50) return 'var(--color-info)'
  if (course.progress > 0) return 'var(--color-warning)'
  return 'var(--color-legacy-6b7280)'
}

export function shouldShowBusinessUserPlatformActivity(
  stats: BusinessUserStatsData,
): boolean {
  return Boolean(
    stats.lia_conversations_total !== undefined ||
      (stats.quiz_total !== undefined && stats.quiz_total > 0) ||
      stats.lia_activities_completed !== undefined,
  )
}

export function buildBusinessUserStatsCompletionBars(
  completedByMonth: BusinessUserStatsCompletedByMonthPoint[],
): BusinessUserStatsCompletionBar[] {
  const maxCount = Math.max(...completedByMonth.map((item) => item.count), 1)

  return completedByMonth.map((item) => ({
    month: item.month,
    count: item.count,
    percentage: (item.count / maxCount) * 100,
  }))
}

export function buildBusinessUserStatsTabs(labels: {
  overview: string
  courses: string
  progress: string
  activity: string
}): BusinessUserStatsTabDefinition[] {
  return [
    { id: 'overview', label: labels.overview },
    { id: 'courses', label: labels.courses },
    { id: 'progress', label: labels.progress },
    { id: 'activity', label: labels.activity },
  ]
}
