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
      inputBg: 'var(--color-gray-100)',
      inverseSubtext: 'rgba(255,255,255,0.72)',
      inverseText: 'var(--color-bg-light)',
      isLightMode: true,
      primary: 'var(--color-primary)',
      secondary: 'var(--color-info)',
      textPrimary: 'var(--color-legacy-0f172a)',
      textSecondary: 'var(--color-gray-500)',
    })
  })

  it('returns greeting by time of day', () => {
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 9, 0, 0))).toBe(
      'Buenos dias'
    )
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 15, 0, 0))).toBe(
      'Buenas tardes'
    )
    expect(getAdminDashboardGreeting(new Date(2026, 3, 2, 21, 0, 0))).toBe(
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
    } as never)

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
      ])
    ).toEqual([
      {
        description: 'Nuevo usuario',
        id: 'notif-1',
        timestamp: 'relative:2026-04-02T10:00:00.000Z',
        title: 'Alta',
        type: 'user',
        user: 'Ada Lovelace',
      },
      {
        description: 'Sin descripcion',
        id: 'notif-2',
        timestamp: 'relative:2026-04-02T11:00:00.000Z',
        title: 'Actividad',
        type: 'system',
        user: 'Usuario',
      },
    ])
  })

  it('returns the configured quick actions', () => {
    expect(getAdminDashboardQuickActions()).toHaveLength(5)
    expect(getAdminDashboardQuickActions()[0]).toMatchObject({
      href: '/admin/workshops/new',
      iconKey: 'courses',
      title: 'Crear Nuevo Curso',
    })
  })
})
