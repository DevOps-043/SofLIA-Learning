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

export function getAdminDashboardGreeting(now: Date) {
  const hour = now.getHours()

  if (hour < 12) {
    return 'Buenos dias'
  }

  if (hour < 18) {
    return 'Buenas tardes'
  }

  return 'Buenas noches'
}

export function getAdminDashboardUserName(
  profile?: AdminDashboardProfileLike | null
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

  return 'Administrador'
}

export function buildAdminDashboardStatsData(
  stats: AdminStatsWithChanges | null
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
      title: 'Usuarios Totales',
      value: stats.totalUsers,
    },
    {
      change: stats.courseGrowth,
      href: '/admin/workshops',
      iconKey: 'courses',
      iconColor: DEFAULT_SUCCESS,
      title: 'Cursos Activos',
      value: stats.activeCourses,
    },
    {
      change: stats.organizationGrowth || 0,
      href: '/admin/companies',
      iconKey: 'organizations',
      iconColor: DEFAULT_ACCENT,
      title: 'Empresas Activas',
      value: stats.totalOrganizations || 0,
    },
    {
      change: stats.engagementGrowth,
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      iconColor: DEFAULT_PURPLE,
      title: 'Engagement',
      value: `${stats.engagementRate}%`,
    },
  ]
}

export function getAdminDashboardQuickActions(): AdminDashboardQuickActionItem[] {
  return [
    {
      color: DEFAULT_SUCCESS,
      description: 'Anade un nuevo taller a la plataforma',
      href: '/admin/workshops/new',
      iconKey: 'courses',
      title: 'Crear Nuevo Curso',
    },
    {
      color: DEFAULT_PRIMARY,
      description: 'Administra permisos y roles',
      href: '/admin/users',
      iconKey: 'users',
      title: 'Gestionar Usuarios',
    },
    {
      color: DEFAULT_ACCENT,
      description: 'Administra organizaciones B2B',
      href: '/admin/companies',
      iconKey: 'organizations',
      title: 'Gestionar Empresas',
    },
    {
      color: DEFAULT_PURPLE,
      description: 'Metricas avanzadas de la IA',
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      title: 'Ver Analytics',
    },
    {
      color: DEFAULT_WARNING,
      description: 'Reportes y metricas del sistema',
      href: '/admin/reportes',
      iconKey: 'documents',
      title: 'Ver Reportes',
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

function getActivityUserName(record: AdminDashboardActivityRecord) {
  const user = record.users

  return (
    user?.display_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    'Usuario'
  )
}

export function mapAdminDashboardActivities(
  activities: AdminDashboardActivityRecord[]
): AdminDashboardActivityItem[] {
  return activities.map((activity) => ({
    description: activity.message || 'Sin descripcion',
    id: activity.notification_id,
    timestamp: formatRelativeTime(activity.created_at),
    title: activity.title || 'Actividad',
    type: getActivityType(activity.notification_type),
    user: getActivityUserName(activity),
  }))
}
