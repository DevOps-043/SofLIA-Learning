import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/utils/date-utils', () => ({
  formatRelativeTime: (value: string) => `relative:${value}`,
}))

import {
  buildAdminDashboardStatsData,
  buildAdminDashboardThemeColors,
  getAdminDashboardGreeting,
  getAdminDashboardQuickActions,
  getAdminDashboardUserName,
  mapAdminDashboardActivities,
} from '../service'

const translations: Record<string, string> = {
  'dashboard.activities.defaultDescription': 'Sin descripcion',
  'dashboard.activities.defaultTitle': 'Actividad',
  'dashboard.activities.defaultUser': 'Usuario',
  'dashboard.greetings.afternoon': 'Buenas tardes',
  'dashboard.greetings.evening': 'Buenas noches',
  'dashboard.greetings.morning': 'Buenos dias',
  'dashboard.quickActions.createCourse.description': 'Anade un nuevo taller a la plataforma',
  'dashboard.quickActions.createCourse.title': 'Crear Nuevo Curso',
  'dashboard.quickActions.manageCompanies.description': 'Administra organizaciones B2B',
  'dashboard.quickActions.manageCompanies.title': 'Gestionar Empresas',
  'dashboard.quickActions.manageUsers.description': 'Administra permisos y roles',
  'dashboard.quickActions.manageUsers.title': 'Gestionar Usuarios',
  'dashboard.quickActions.viewAnalytics.description': 'Metricas avanzadas de la IA',
  'dashboard.quickActions.viewAnalytics.title': 'Ver Analytics',
  'dashboard.quickActions.viewReports.description': 'Reportes y metricas del sistema',
  'dashboard.quickActions.viewReports.title': 'Ver Reportes',
  'dashboard.stats.courses': 'Cursos Activos',
  'dashboard.stats.engagement': 'Engagement',
  'dashboard.stats.organizations': 'Empresas Activas',
  'dashboard.stats.users': 'Usuarios Totales',
}

const t = (key: string) => translations[key] ?? key

describe('admin-dashboard service', () => {
  it('builds light theme colors with organization overrides', () => {
    expect(
      buildAdminDashboardThemeColors(true, {
        background_value: 'var(--color-legacy-fafafa)',
        card_background: 'var(--color-bg-light)',
      })
    ).toEqual({
      accent: 'var(--color-accent)',
      background: 'var(--color-legacy-fafafa)',
      borderColor: 'var(--color-gray-200)',
      cardBackground: 'var(--color-bg-light)',
      inputBg: 'color-mix(in srgb, var(--color-contrast) 4%, transparent)',
      inverseSubtext: 'color-mix(in srgb, var(--color-bg-light) 72%, transparent)',
      inverseText: 'var(--color-bg-light)',
      isLightMode: true,
      primary: 'var(--color-primary)',
      secondary: 'var(--color-info)',
      textPrimary: 'var(--color-contrast)',
      textSecondary: 'var(--color-muted)',
    })
  })

  it('returns greeting by time of day', () => {
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 9, 0, 0), t)).toBe(
      'Buenos dias'
    )
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 15, 0, 0), t)).toBe(
      'Buenas tardes'
    )
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 21, 0, 0), t)).toBe(
      'Buenas noches'
    )
  })

  it('prioritizes full profile name over display name and username', () => {
    expect(
      getAdminDashboardUserName({
        display_name: 'Display',
        first_name: 'Ada',
        last_name: 'Lovelace',
        username: 'adal',
      })
    ).toBe('Ada Lovelace')
    expect(getAdminDashboardUserName({ display_name: 'Display' })).toBe('Display')
    expect(getAdminDashboardUserName(undefined)).toBe('Administrador')
  })

  it('maps admin stats to dashboard cards', () => {
    const stats = buildAdminDashboardStatsData({
      activeCourses: 4,
      courseGrowth: 7,
      engagementGrowth: 5,
      engagementRate: 91,
      organizationGrowth: 3,
      totalOrganizations: 2,
      totalUsers: 100,
      userGrowth: 12,
    } as never, t)

    expect(stats).toHaveLength(4)
    expect(stats[0]).toMatchObject({
      href: '/admin/users',
      iconKey: 'users',
      title: 'Usuarios Totales',
      value: 100,
    })
    expect(stats[3]).toMatchObject({
      href: '/admin/lia-analytics',
      value: '91%',
    })
  })

  it('maps recent activity with fallback user names and types', () => {
    expect(
      mapAdminDashboardActivities([
        {
          created_at: '2026-04-02T10:00:00.000Z',
          message: 'Nuevo usuario',
          notification_id: 'notif-1',
          notification_type: 'user.created',
          title: 'Alta',
          users: {
            first_name: 'Ada',
            last_name: 'Lovelace',
          },
        },
        {
          created_at: '2026-04-02T11:00:00.000Z',
          notification_id: 'notif-2',
          notification_type: 'system',
        },
      ], t, 'es', t)
    ).toEqual([
      {
        description: 'Nuevo usuario',
        id: 'notif-1',
        metadata: {},
        timestamp: 'relative:2026-04-02T10:00:00.000Z',
        title: 'Alta',
        type: 'user',
        user: 'Ada Lovelace',
      },
      {
        description: 'Sin descripcion',
        id: 'notif-2',
        metadata: {},
        timestamp: 'relative:2026-04-02T11:00:00.000Z',
        title: 'Actividad',
        type: 'system',
        user: 'Usuario',
      },
    ])
  })

  it('returns the configured quick actions', () => {
    expect(getAdminDashboardQuickActions(t)).toHaveLength(5)
    expect(getAdminDashboardQuickActions(t)[0]).toMatchObject({
      href: '/admin/workshops/new',
      iconKey: 'courses',
      title: 'Crear Nuevo Curso',
    })
  })
})
