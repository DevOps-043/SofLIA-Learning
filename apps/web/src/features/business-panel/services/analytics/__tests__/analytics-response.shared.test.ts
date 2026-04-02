import { describe, expect, it } from 'vitest'

import {
  buildHourlyDistribution,
  createEnrollmentMap,
  formatTrends,
  getAssignmentProgress,
  getOrganizationUserProfile,
  getRelevantAnalyticsCourseIds,
  isAssignmentCompleted,
  processTrend,
} from '../analytics-response.shared'

describe('analytics-response shared', () => {
  it('deduplicates relevant course ids across assignments and enrollments', () => {
    expect(
      getRelevantAnalyticsCourseIds({
        assignments: [
          { course_id: 'course-1' },
          { course_id: 'course-1' },
          { course_id: 'course-2' },
        ] as never,
        enrollments: [
          { course_id: 'course-2' },
          { course_id: 'course-3' },
        ] as never,
      }),
    ).toEqual(['course-1', 'course-2', 'course-3'])
  })

  it('builds enrollment lookups and resolves completion/progress', () => {
    const enrollmentMap = createEnrollmentMap([
      {
        completed_at: null,
        course_id: 'course-1',
        enrolled_at: null,
        enrollment_id: 'enrollment-1',
        enrollment_status: 'active',
        overall_progress_percentage: 65,
        started_at: '2026-04-01T10:00:00.000Z',
        user_id: 'user-1',
      },
    ])
    const assignment = {
      assigned_at: null,
      completed_at: null,
      completion_percentage: 40,
      course_id: 'course-1',
      due_date: null,
      id: 'assignment-1',
      status: null,
      user_id: 'user-1',
    }

    expect(getAssignmentProgress(assignment, enrollmentMap.get('user-1_course-1'))).toBe(65)
    expect(isAssignmentCompleted(assignment, enrollmentMap.get('user-1_course-1'))).toBe(false)
    expect(
      isAssignmentCompleted(
        assignment,
        {
          ...enrollmentMap.get('user-1_course-1'),
          enrollment_status: 'completed',
        } as never,
      ),
    ).toBe(true)
  })

  it('normalizes organization user relations and ignores invalid session dates', () => {
    const hourTenIso = new Date(2026, 3, 2, 10, 0, 0).toISOString()
    const distribution = buildHourlyDistribution([
      {
        actual_duration_minutes: 30,
        completed_at: null,
        id: 'session-1',
        session_type: 'study',
        start_time: hourTenIso,
        status: 'completed',
        user_id: 'user-1',
      },
      {
        actual_duration_minutes: 10,
        completed_at: null,
        id: 'session-2',
        session_type: 'study',
        start_time: 'not-a-date',
        status: 'completed',
        user_id: 'user-1',
      },
    ])

    expect(
      getOrganizationUserProfile([
        {
          display_name: 'Ada',
          email: 'ada@example.com',
          first_name: 'Ada',
          id: 'profile-1',
          last_login_at: null,
          last_name: 'Lovelace',
          profile_picture_url: null,
          username: 'ada',
        },
      ]),
    ).toMatchObject({
      display_name: 'Ada',
      first_name: 'Ada',
    })
    expect(distribution.reduce((sum, value) => sum + value, 0)).toBe(1)
  })

  it('formats monthly trends in ascending order and keeps the last six buckets', () => {
    const trendMap = new Map<string, number>()

    ;[
      '2025-10-01T00:00:00.000Z',
      '2025-11-01T00:00:00.000Z',
      '2025-12-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
      '2026-04-01T00:00:00.000Z',
    ].forEach((value) => processTrend(value, trendMap))

    expect(formatTrends(trendMap)).toEqual([
      { count: 1, date: '2025-11' },
      { count: 1, date: '2025-12' },
      { count: 1, date: '2026-01' },
      { count: 1, date: '2026-02' },
      { count: 1, date: '2026-03' },
      { count: 1, date: '2026-04' },
    ])
  })
})
