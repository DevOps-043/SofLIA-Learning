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

const DEFAULT_LIGHT_BACKGROUND = 'var(--color-bg-dark)'
const DEFAULT_LIGHT_CARD = 'var(--color-bg-light)'
const DEFAULT_DARK_BACKGROUND = 'var(--color-bg-dark)'
const DEFAULT_DARK_CARD = 'var(--color-gray-800)'
const DEFAULT_LIGHT_INPUT = 'color-mix(in srgb, var(--color-contrast) 4%, transparent)'
const DEFAULT_PRIMARY = 'var(--color-primary)'
const DEFAULT_ACCENT = 'var(--color-accent)'
const DEFAULT_SECONDARY = 'var(--color-info)'
const DEFAULT_SUCCESS = 'var(--color-success)'
const DEFAULT_WARNING = 'var(--color-warning)'
const DEFAULT_PURPLE = 'var(--color-secondary)'

type TranslateFunction = (key: string, options?: Record<string, unknown>) => string

function translate(
  t: unknown,
  key: string,
  options?: Record<string, unknown>
) {
  return typeof t === 'function' ? (t as TranslateFunction)(key, options) : key
}

export function buildAdminDashboardThemeColors(
  isLightTheme: boolean,
  panelStyles?: AdminDashboardPanelStyles | null
): AdminDashboardThemeColors {
  const primary = panelStyles?.primary_button_color || DEFAULT_PRIMARY
  const accent = panelStyles?.accent_color || DEFAULT_ACCENT
  const secondary = panelStyles?.secondary_button_color || DEFAULT_SECONDARY

  return {
    accent,
    background: panelStyles?.background_value || (isLightTheme ? DEFAULT_LIGHT_BACKGROUND : DEFAULT_DARK_BACKGROUND),
    borderColor: isLightTheme
      ? 'var(--color-gray-200)'
      : 'color-mix(in srgb, var(--color-bg-light) 6%, transparent)',
    cardBackground: panelStyles?.card_background || (isLightTheme ? DEFAULT_LIGHT_CARD : DEFAULT_DARK_CARD),
    inputBg: isLightTheme ? DEFAULT_LIGHT_INPUT : DEFAULT_DARK_CARD,
    inverseSubtext: 'color-mix(in srgb, var(--color-bg-light) 72%, transparent)',
    inverseText: 'var(--color-bg-light)',
    isLightMode: isLightTheme,
    primary,
    secondary,
    textPrimary: panelStyles?.text_color || 'var(--color-contrast)',
    textSecondary: 'var(--color-muted)',
  }
}

export function getAdminDashboardGreeting(now: Date, t?: unknown) {
  const hour = now.getHours()

  if (hour < 12) {
    return translate(t, 'dashboard.greetings.morning')
  }

  if (hour < 18) {
    return translate(t, 'dashboard.greetings.afternoon')
  }

  return translate(t, 'dashboard.greetings.evening')
}

export function getAdminDashboardUserName(
  profile?: AdminDashboardProfileLike | null,
  t?: unknown
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

  return typeof t === 'function'
    ? translate(t, 'dashboard.activities.defaultUser')
    : 'Administrador'
}

export function buildAdminDashboardStatsData(
  stats: AdminStatsWithChanges | null,
  t?: unknown
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
      title: translate(t, 'dashboard.stats.users'),
      value: stats.totalUsers,
    },
    {
      change: stats.courseGrowth,
      href: '/admin/workshops',
      iconKey: 'courses',
      iconColor: DEFAULT_SUCCESS,
      title: translate(t, 'dashboard.stats.courses'),
      value: stats.activeCourses,
    },
    {
      change: stats.organizationGrowth || 0,
      href: '/admin/companies',
      iconKey: 'organizations',
      iconColor: DEFAULT_ACCENT,
      title: translate(t, 'dashboard.stats.organizations'),
      value: stats.totalOrganizations || 0,
    },
    {
      // El engagement ya no lleva variación: se calculaba sobre user_favorites,
      // tabla retirada con las features de consumidor.
      change: 0,
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      iconColor: DEFAULT_PURPLE,
      title: translate(t, 'dashboard.stats.engagement'),
      value: `${stats.engagementRate}%`,
    },
  ]
}

export function getAdminDashboardQuickActions(t?: unknown): AdminDashboardQuickActionItem[] {
  return [
    {
      color: DEFAULT_SUCCESS,
      description: translate(t, 'dashboard.quickActions.createCourse.description'),
      href: '/admin/workshops/new',
      iconKey: 'courses',
      title: translate(t, 'dashboard.quickActions.createCourse.title'),
    },
    {
      color: DEFAULT_PRIMARY,
      description: translate(t, 'dashboard.quickActions.manageUsers.description'),
      href: '/admin/users',
      iconKey: 'users',
      title: translate(t, 'dashboard.quickActions.manageUsers.title'),
    },
    {
      color: DEFAULT_ACCENT,
      description: translate(t, 'dashboard.quickActions.manageCompanies.description'),
      href: '/admin/companies',
      iconKey: 'organizations',
      title: translate(t, 'dashboard.quickActions.manageCompanies.title'),
    },
    {
      color: DEFAULT_PURPLE,
      description: translate(t, 'dashboard.quickActions.viewAnalytics.description'),
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      title: translate(t, 'dashboard.quickActions.viewAnalytics.title'),
    },
    {
      color: DEFAULT_WARNING,
      description: translate(t, 'dashboard.quickActions.viewReports.description'),
      href: '/admin/reportes',
      iconKey: 'documents',
      title: translate(t, 'dashboard.quickActions.viewReports.title'),
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

function getActivityUserName(record: AdminDashboardActivityRecord, t?: unknown) {
  const user = record.users

  return (
    user?.display_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    (typeof t === 'function' ? translate(t, 'dashboard.activities.defaultUser') : 'Usuario')
  )
}

export function mapAdminDashboardActivities(
  activities: AdminDashboardActivityRecord[],
  tn?: unknown, // t for notifications (common)
  language: 'es' | 'en' | 'pt' = 'es',
  ta?: unknown // t for admin/fallbacks (admin)
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
      ? translate(t, activity.title, metadata as Record<string, unknown>)
      : activity.title || translate(tFallback, 'dashboard.activities.defaultTitle')

    const description = metadata?.is_localized && activity.message
      ? translate(t, activity.message, metadata as Record<string, unknown>)
      : activity.message || translate(tFallback, 'dashboard.activities.defaultDescription')

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
