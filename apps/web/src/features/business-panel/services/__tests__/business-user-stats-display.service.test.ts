import { describe, expect, it } from 'vitest'
import {
  buildBusinessUserStatsCompletionBars,
  buildBusinessUserStatsTabs,
  getBusinessUserStatsCourseProgressColor,
  getBusinessUserStatsDisplayName,
  getBusinessUserStatsInitials,
  getBusinessUserStatsRoleTranslationKey,
  shouldShowBusinessUserPlatformActivity,
} from '../business-user-stats-display.service'

describe('business-user-stats-display.service', () => {
  it('builds user display name and initials with fallbacks', () => {
    expect(
      getBusinessUserStatsDisplayName({
        id: 'user-1',
        username: 'ana',
        email: 'ana@example.com',
        platform_role: 'Manager',
        email_verified: true,
        points: 0,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        display_name: 'Ana Ruiz',
      }),
    ).toBe('Ana Ruiz')

    expect(
      getBusinessUserStatsDisplayName({
        id: 'user-2',
        username: 'mario',
        email: 'mario@example.com',
        platform_role: 'Lead',
        email_verified: true,
        points: 0,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        first_name: 'Mario',
      }),
    ).toBe('Mario')

    expect(
      getBusinessUserStatsInitials({
        id: 'user-3',
        username: 'lucia',
        email: 'lucia@example.com',
        platform_role: 'Analyst',
        email_verified: true,
        points: 0,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        first_name: 'Lucia',
      }),
    ).toBe('L')
  })

  it('resolves translation keys and progress colors', () => {
    expect(getBusinessUserStatsRoleTranslationKey('owner')).toBe('users.roles.owner')
    expect(getBusinessUserStatsRoleTranslationKey('admin')).toBe('users.roles.admin')
    expect(getBusinessUserStatsRoleTranslationKey('member')).toBe('users.roles.member')
    expect(getBusinessUserStatsCourseProgressColor({ status: 'completed', progress: 100 })).toBe(
      'var(--color-success)',
    )
    expect(getBusinessUserStatsCourseProgressColor({ status: 'active', progress: 60 })).toBe(
      'var(--color-info)',
    )
    expect(getBusinessUserStatsCourseProgressColor({ status: 'active', progress: 15 })).toBe(
      'var(--color-warning)',
    )
    expect(getBusinessUserStatsCourseProgressColor({ status: 'pending', progress: 0 })).toBe(
      'var(--color-legacy-6b7280)',
    )
  })

  it('detects when platform activity cards should be rendered', () => {
    expect(
      shouldShowBusinessUserPlatformActivity({
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        not_started_courses: 0,
        average_progress: 0,
        total_time_spent_minutes: 0,
        total_time_spent_hours: 0,
        completed_lessons: 0,
        total_lessons: 0,
        certificates_count: 0,
        notes_count: 0,
        total_assignments: 0,
        completed_assignments: 0,
        courses_data: [],
        time_by_course: [],
        completed_by_month: [],
        distribution: { completed: 0, in_progress: 0, not_started: 0 },
      }),
    ).toBe(false)

    expect(
      shouldShowBusinessUserPlatformActivity({
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        not_started_courses: 0,
        average_progress: 0,
        total_time_spent_minutes: 0,
        total_time_spent_hours: 0,
        completed_lessons: 0,
        total_lessons: 0,
        certificates_count: 0,
        notes_count: 0,
        total_assignments: 0,
        completed_assignments: 0,
        lia_conversations_total: 3,
        courses_data: [],
        time_by_course: [],
        completed_by_month: [],
        distribution: { completed: 0, in_progress: 0, not_started: 0 },
      }),
    ).toBe(true)
  })

  it('builds chart helpers for completion history and tabs', () => {
    expect(
      buildBusinessUserStatsCompletionBars([
        { month: '2025-01', count: 1 },
        { month: '2025-02', count: 4 },
      ]),
    ).toEqual([
      { month: '2025-01', count: 1, percentage: 25 },
      { month: '2025-02', count: 4, percentage: 100 },
    ])

    expect(
      buildBusinessUserStatsTabs({
        overview: 'Resumen',
        courses: 'Cursos',
        progress: 'Progreso',
        activity: 'Actividad',
      }).map((tab) => tab.id),
    ).toEqual(['overview', 'courses', 'progress', 'activity'])
  })
})
