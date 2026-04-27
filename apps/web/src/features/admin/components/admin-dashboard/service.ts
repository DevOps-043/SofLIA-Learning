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

export function buildAdminDashboardThemeColors(
  isLightTheme: boolean,
  panelStyles?: AdminDashboardPanelStyles | null
): AdminDashboardThemeColors {
  return {
    background: isLightTheme
      ? panelStyles?.background_value &&
        panelStyles.background_value !== 'var(--color-bg-dark)'
        ? panelStyles.background_value
        : 'var(--color-gray-800)'
      : 'var(--color-bg-dark)',
    borderColor: isLightTheme ? 'var(--color-gray-200)' : 'var(--color-gray-500)',
    cardBackground: isLightTheme
      ? panelStyles?.card_background &&
        panelStyles.card_background !== 'var(--color-gray-800)'
        ? panelStyles.card_background
        : 'var(--color-bg-light)'
      : 'var(--color-gray-800)',
    inputBg: isLightTheme ? 'var(--color-gray-700)' : 'var(--color-gray-950)',
    textPrimary: isLightTheme ? 'var(--color-gray-100)' : 'var(--color-gray-50)',
    textSecondary: isLightTheme ? 'var(--color-gray-600)' : 'var(--color-gray-400)',
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
      tone: 'primary',
      title: 'Usuarios Totales',
      value: stats.totalUsers,
    },
    {
      change: stats.courseGrowth,
      href: '/admin/workshops',
      iconKey: 'courses',
      tone: 'primary',
      title: 'Cursos Activos',
      value: stats.activeCourses,
    },
    {
      change: stats.organizationGrowth || 0,
      href: '/admin/companies',
      iconKey: 'organizations',
      tone: 'primary',
      title: 'Empresas Activas',
      value: stats.totalOrganizations || 0,
    },
    {
      change: stats.engagementGrowth,
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      tone: 'primary',
      title: 'Engagement',
      value: `${stats.engagementRate}%`,
    },
  ]
}

export function getAdminDashboardQuickActions(): AdminDashboardQuickActionItem[] {
  return [
    {
      description: 'Anade un nuevo taller a la plataforma',
      href: '/admin/workshops/new',
      iconKey: 'courses',
      tone: 'primary',
      title: 'Crear Nuevo Curso',
    },
    {
      description: 'Administra permisos y roles',
      href: '/admin/users',
      iconKey: 'users',
      tone: 'primary',
      title: 'Gestionar Usuarios',
    },
    {
      description: 'Administra organizaciones B2B',
      href: '/admin/companies',
      iconKey: 'organizations',
      tone: 'primary',
      title: 'Gestionar Empresas',
    },
    {
      description: 'Metricas avanzadas de la IA',
      href: '/admin/lia-analytics',
      iconKey: 'engagement',
      tone: 'primary',
      title: 'Ver Analytics',
    },
    {
      description: 'Reportes y metricas del sistema',
      href: '/admin/reportes',
      iconKey: 'documents',
      tone: 'primary',
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
