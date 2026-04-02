import { describe, expect, it, vi } from 'vitest'
import {
  buildBusinessUserDashboardColors,
  buildBusinessUserDashboardStats,
  buildBusinessUserIntroVideos,
  formatBusinessUserDashboardDate,
  getBusinessUserCertificateRoute,
  getBusinessUserDashboardGreeting,
  getBusinessUserDisplayName,
  getBusinessUserInitials,
} from '../services/business-user-dashboard.service'

describe('business-user-dashboard.service', () => {
  it('builds adaptive colors from theme and optional org styles', () => {
    const colors = buildBusinessUserDashboardColors({
      userDashboardStyles: {
        background_type: 'color',
        background_value: '#fff',
        primary_button_color: '#112233',
        secondary_button_color: '#000000',
        accent_color: '#445566',
        sidebar_background: '#778899',
        card_background: '#ffffff',
      },
      resolvedTheme: 'light',
    })

    expect(colors.primary).toBe('#112233')
    expect(colors.accent).toBe('#445566')
    expect(colors.sidebarBg).toBe('#778899')
    expect(colors.isLightMode).toBe(true)
  })

  it('derives display name and initials from user identity', () => {
    expect(
      getBusinessUserDisplayName({ first_name: 'Ana', last_name: 'Lopez', username: 'alopez' })
    ).toBe('Ana Lopez')
    expect(getBusinessUserInitials({ first_name: 'Ana', last_name: 'Lopez' })).toBe('AL')
    expect(getBusinessUserInitials({ username: 'usuario' })).toBe('U')
  })

  it('builds greeting and stats labels with translator', () => {
    const t = vi.fn((key: string, fallback?: string) => fallback || key)
    const greeting = getBusinessUserDashboardGreeting(new Date('2026-04-01T09:00:00'), t)
    const stats = buildBusinessUserDashboardStats(
      { total_assigned: 4, in_progress: 2, completed: 1, certificates: 1 },
      t
    )

    expect(greeting).toBe('dashboard.greetings.morning')
    expect(stats).toHaveLength(4)
    expect(stats[0]?.value).toBe(4)
  })

  it('formats dates, videos and certificate routes safely', () => {
    expect(formatBusinessUserDashboardDate(new Date('2026-04-01T09:00:00Z'), 'es')).toContain('2026')
    expect(buildBusinessUserIntroVideos(undefined)).toEqual([])
    expect(buildBusinessUserIntroVideos('https://example.supabase.co')).toHaveLength(2)
    expect(
      getBusinessUserCertificateRoute([{ course_id: 'course-1', certificate_id: 'cert-9' }], 'course-1')
    ).toBe('/certificates/cert-9')
    expect(getBusinessUserCertificateRoute([], 'missing')).toBe('/certificates')
  })
})
