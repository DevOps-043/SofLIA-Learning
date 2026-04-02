import { describe, expect, it } from 'vitest'
import {
  buildBusinessAnalyticsActivityWeeks,
  getBusinessAnalyticsCompletionWidth,
  getBusinessAnalyticsHeatmapColor,
  getBusinessAnalyticsMaxHour,
  getBusinessAnalyticsProgressColor,
  getBusinessAnalyticsRelativeBarWidth,
  getBusinessAnalyticsTeamSummary,
  getBusinessAnalyticsUserDisplayName,
  getBusinessAnalyticsUserInitials,
  getBusinessAnalyticsUserRoleTone,
} from '../business-analytics-display.service'

describe('business-analytics-display.service', () => {
  it('builds user display names with ordered fallbacks', () => {
    expect(
      getBusinessAnalyticsUserDisplayName(
        {
          first_name: 'Ana',
          last_name: 'Lopez',
          email: 'ana@example.com',
        },
        'Sin nombre',
      ),
    ).toBe('Ana Lopez')

    expect(
      getBusinessAnalyticsUserDisplayName(
        {
          username: 'ana-user',
        },
        'Sin nombre',
      ),
    ).toBe('ana-user')
  })

  it('derives initials from display name or email fallback', () => {
    expect(
      getBusinessAnalyticsUserInitials(
        {
          display_name: 'Mario Perez',
          email: 'mario@example.com',
        },
        'Sin nombre',
      ),
    ).toBe('M')

    expect(
      getBusinessAnalyticsUserInitials(
        {
          email: 'fallback@example.com',
        },
        'Sin nombre',
      ),
    ).toBe('F')
  })

  it('classifies roles into stable UI tones', () => {
    expect(getBusinessAnalyticsUserRoleTone('admin')).toBe('admin')
    expect(getBusinessAnalyticsUserRoleTone('Senior Instructor')).toBe('instructor')
    expect(getBusinessAnalyticsUserRoleTone('student')).toBe('member')
  })

  it('returns consistent progress and heatmap colors', () => {
    expect(getBusinessAnalyticsProgressColor(90)).toBe('#10b981')
    expect(getBusinessAnalyticsProgressColor(50)).toBe('#f59e0b')
    expect(getBusinessAnalyticsProgressColor(10)).toBe('#ef4444')
    expect(getBusinessAnalyticsHeatmapColor(0)).toBe('bg-gray-200 dark:bg-white/5')
    expect(getBusinessAnalyticsHeatmapColor(4)).toBe('bg-emerald-500')
  })

  it('calculates bar widths and max hour safely', () => {
    expect(getBusinessAnalyticsRelativeBarWidth(50, 200)).toBe(25)
    expect(getBusinessAnalyticsRelativeBarWidth(50, 0)).toBe(0)
    expect(getBusinessAnalyticsCompletionWidth(3, 4)).toBe(75)
    expect(getBusinessAnalyticsCompletionWidth(1, 0)).toBe(0)
    expect(getBusinessAnalyticsMaxHour([0, 3, 7, 2])).toBe(7)
    expect(getBusinessAnalyticsMaxHour(undefined)).toBe(1)
  })

  it('summarizes team KPIs from team and ranking collections', () => {
    const summary = getBusinessAnalyticsTeamSummary(
      [
        {
          team_id: 'team-1',
          name: 'A',
          description: null,
          image_url: null,
          member_count: 4,
          stats: {
            average_progress: 70,
            courses_completed: 8,
            total_enrollments: 10,
            total_time_hours: 30,
            lia_conversations: 3,
          },
        },
        {
          team_id: 'team-2',
          name: 'B',
          description: null,
          image_url: null,
          member_count: 6,
          stats: {
            average_progress: 90,
            courses_completed: 9,
            total_enrollments: 12,
            total_time_hours: 40,
            lia_conversations: 5,
          },
        },
      ],
      [
        {
          team_id: 'team-2',
          name: 'B',
          description: null,
          image_url: null,
          member_count: 6,
          stats: {
            average_progress: 90,
            courses_completed: 9,
            total_enrollments: 12,
            total_time_hours: 40,
            lia_conversations: 5,
          },
        },
      ],
    )

    expect(summary).toEqual({
      totalMembers: 10,
      totalLiaChats: 8,
      bestTeamName: 'B',
      bestTeamProgress: 90,
    })
  })

  it('builds activity weeks for the user detail heatmap', () => {
    const weeks = buildBusinessAnalyticsActivityWeeks(
      [
        { date: '2026-03-09', count: 20, level: 2 },
        { date: '2026-03-10', count: 45, level: 3 },
      ],
      new Date('2026-03-15T12:00:00'),
      2,
    )

    expect(weeks).toHaveLength(2)
    expect(weeks[1].find((day) => day.date === '2026-03-09')).toMatchObject({
      count: 20,
      level: 2,
      isFuture: false,
    })
    expect(weeks[1].find((day) => day.date === '2026-03-10')).toMatchObject({
      count: 45,
      level: 3,
      isFuture: false,
    })
  })
})
