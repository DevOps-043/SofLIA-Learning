import type { AdminStatsWithChanges } from '@/features/admin/services/admin-stats.types'
import { formatRelativeTime } from '@/core/utils/date-utils'

import type {
  AdminDashboardActivityItem,
  AdminDashboardActivityRecord,
  AdminDashboardPanelStyles,
  AdminDashboardProfileLike,
  AdminDashboardQuickActionItem,
  AdminDashboardStatItem,
  AdminDashboardThemeColors,
} from './types'

const DEFAULT_LIGHT_BACKGROUND = '#F8FAFC'
const DEFAULT_LIGHT_CARD = '#FFFFFF'
const DEFAULT_DARK_BACKGROUND = '#0F1419'
const DEFAULT_DARK_CARD = '#1E2329'
const DEFAULT_PRIMARY = '#0A2540'
const DEFAULT_ACCENT = '#00D4B3'
const DEFAULT_SECONDARY = '#3B82F6'
const DEFAULT_SUCCESS = '#10B981'
const DEFAULT_WARNING = '#F59E0B'
const DEFAULT_PURPLE = '#8B5CF6'

export function buildAdminDashboardThemeColors(
  isLightTheme: boolean,
  panelStyles?: AdminDashboardPanelStyles | null
): AdminDashboardThemeColors {
  const primary = panelStyles?.primary_button_color || DEFAULT_PRIMARY
  const accent = panelStyles?.accent_color || DEFAULT_ACCENT
  const secondary = panelStyles?.secondary_button_color || DEFAULT_SECONDARY

  return {
    accent,
    background: isLightTheme
      ? panelStyles?.background_value &&
        panelStyles.background_value !== DEFAULT_DARK_BACKGROUND
        ? panelStyles.background_value
        : DEFAULT_LIGHT_BACKGROUND
      : DEFAULT_DARK_BACKGROUND,
    borderColor: isLightTheme ? '#E2E8F0' : 'rgba(255,255,255,0.06)',
    cardBackground: isLightTheme
      ? panelStyles?.card_background &&
        panelStyles.card_background !== DEFAULT_DARK_CARD
        ? panelStyles.card_background
        : DEFAULT_LIGHT_CARD
      : DEFAULT_DARK_CARD,
    inputBg: isLightTheme ? '#F1F5F9' : DEFAULT_DARK_CARD,
    inverseSubtext: 'rgba(255,255,255,0.72)',
    inverseText: '#FFFFFF',
    isLightMode: isLightTheme,
    primary,
    secondary,
    textPrimary: isLightTheme ? '#0F172A' : '#FFFFFF',
    textSecondary: isLightTheme ? '#64748B' : '#858E9B',
  }
}

export function getAdminDashboardGreeting(now: Date, t: any) {
  const hour = now.getHours()

  if (hour < 12) {
    return t('dashboard.greetings.morning')
  }

  if (hour < 18) {
    return t('dashboard.greetings.afternoon')
  }

  return t('dashboard.greetings.evening')
}

export function getAdminDashboardUserName(
  profile?: AdminDashboardProfileLike | null,
  t?: any
) {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`
  }

  if (profile?.display_name) {
    return profile.display_name
  }

  if (profile?.first_name) {
    return profile.first_name
  }

  if (profile?.username) {
    return profile.username
  }

  return t ? t('dashboard.activities.defaultUser') : 'Administrador'
}

export function buildAdminDashboardStatsData(
  stats: AdminStatsWithChanges | null,
  t: any
): AdminDashboardStatItem[] {
  if (!stats) {
    return []
  }

  return [
    {
      change: stats.userGrowth,
      href: '/admin/users',
      iconKey: 'users',
      iconColor: DEFAULT_PRIMARY,
      title: t('dashboard.stats.users'),
      value: stats.totalUsers,
    },
    {
      change: stats.courseGrowth,
      href: '/admin/workshops',
      iconKey: 'courses',
      iconColor: DEFAULT_SUCCESS,
      title: t('dashboard.stats.courses'),
      value: stats.activeCourses,
    },
    {
      change: stats.organizationGrowth || 0,
      href: '/admin/companies',
      iconKey: 'organizations',
      iconColor: DEFAULT_ACCENT,
      title: t('dashboard.stats.organizations'),
      value: stats.totalOrganizations || 0,
    },
    {
      change: stats.engagementGrowth,
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      iconColor: DEFAULT_PURPLE,
      title: t('dashboard.stats.engagement'),
      value: `${stats.engagementRate}%`,
    },
  ]
}

export function getAdminDashboardQuickActions(t: any): AdminDashboardQuickActionItem[] {
  return [
    {
      color: DEFAULT_SUCCESS,
      description: t('dashboard.quickActions.createCourse.description'),
      href: '/admin/workshops/new',
      iconKey: 'courses',
      title: t('dashboard.quickActions.createCourse.title'),
    },
    {
      color: DEFAULT_PRIMARY,
      description: t('dashboard.quickActions.manageUsers.description'),
      href: '/admin/users',
      iconKey: 'users',
      title: t('dashboard.quickActions.manageUsers.title'),
    },
    {
      color: DEFAULT_ACCENT,
      description: t('dashboard.quickActions.manageCompanies.description'),
      href: '/admin/companies',
      iconKey: 'organizations',
      title: t('dashboard.quickActions.manageCompanies.title'),
    },
    {
      color: DEFAULT_PURPLE,
      description: t('dashboard.quickActions.viewAnalytics.description'),
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      title: t('dashboard.quickActions.viewAnalytics.title'),
    },
    {
      color: DEFAULT_WARNING,
      description: t('dashboard.quickActions.viewReports.description'),
      href: '/admin/reportes',
      iconKey: 'documents',
      title: t('dashboard.quickActions.viewReports.title'),
    },
  ]
}

function getActivityType(notificationType?: string | null) {
  if (notificationType?.includes('user')) {
    return 'user' as const
  }

  if (notificationType?.includes('course')) {
    return 'workshop' as const
  }

  if (notificationType?.includes('ai')) {
    return 'ai-app' as const
  }

  if (notificationType?.includes('news')) {
    return 'news' as const
  }

  return 'system' as const
}

function getActivityUserName(record: AdminDashboardActivityRecord, t: any) {
  const user = record.users

  return (
    user?.display_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    t('dashboard.activities.defaultUser')
  )
}

export function mapAdminDashboardActivities(
  activities: AdminDashboardActivityRecord[],
  tn: any, // t for notifications (common)
  language: 'es' | 'en' | 'pt' = 'es',
  ta?: any // t for admin/fallbacks (admin)
): AdminDashboardActivityItem[] {
  const t = tn;
  const tFallback = ta || tn;
  return activities.map((activity) => {
    // Asegurar que metadata sea un objeto (manejar posibles strings JSON)
    let metadata = activity.metadata
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata)
      } catch (e) {
        metadata = {}
      }
    }

    const title = metadata?.is_localized && activity.title
      ? t(activity.title)
      : activity.title || tFallback('dashboard.activities.defaultTitle')

    const description = metadata?.is_localized && activity.message
      ? t(activity.message, metadata as any)
      : activity.message || tFallback('dashboard.activities.defaultDescription')

    return {
      description,
      id: activity.notification_id,
      metadata: (metadata || {}) as Record<string, unknown>,
      timestamp: formatRelativeTime(activity.created_at, language),
      title,
      type: getActivityType(activity.notification_type),
      user: getActivityUserName(activity, tFallback),
    }
  })
}
