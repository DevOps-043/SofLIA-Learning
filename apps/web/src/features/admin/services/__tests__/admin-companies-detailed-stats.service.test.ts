import { describe, expect, it } from 'vitest'

import { buildCompanyDetailedStats } from '../admin-companies/admin-companies-detailed-stats.service'

describe('admin-companies-detailed-stats.service', () => {
  it('builds overview, monthly activity and engagement using real user ids', () => {
    const result = buildCompanyDetailedStats({
      assignments: [
        {
          course_id: 'course-1',
          completion_percentage: 100,
          status: 'completed',
          courses: { title: 'Curso A' },
        },
        {
          course_id: 'course-1',
          completion_percentage: 50,
          status: 'in_progress',
          courses: { title: 'Curso A' },
        },
      ],
      sessions: [
        {
          actual_duration_minutes: 90,
          completed_at: '2025-03-25T10:00:00.000Z',
          self_evaluation: 5,
          user_id: 'user-1',
        },
        {
          actual_duration_minutes: 30,
          completed_at: '2025-03-28T10:00:00.000Z',
          self_evaluation: 3,
          user_id: 'user-2',
        },
      ],
      members: [
        { status: 'active', organization_teams: { name: 'Ventas' } },
        { status: 'active', organization_teams: [{ name: 'Ventas' }] },
        { status: 'invited', organization_teams: null },
      ],
      pendingInvitationCount: 2,
      now: new Date('2025-03-31T12:00:00.000Z'),
    })

    expect(result.overview).toMatchObject({
      totalUsers: 3,
      activeUsers: 2,
      invitedUsers: 3,
      assignedCourses: 1,
      totalLearningHours: 2,
      totalSessions: 2,
      engagementRate: 67,
      avgSatisfaction: 4,
    })
    expect(result.activityMonthly.at(-1)).toEqual({ month: 'MAR', hours: 2, sessions: 2 })
    expect(result.courseProgress[0]).toEqual({
      id: 'course-1',
      title: 'Curso A',
      averageProgress: 75,
      enrolledCount: 2,
      completedCount: 1,
    })
    expect(result.teamDistribution[0]).toEqual({ name: 'Ventas', value: 2 })
  })
})
