import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BusinessAnalyticsService } from '../analytics.service'
import type { BusinessAnalyticsRepository } from '../analytics.repository'
import type {
  AnalyticsOrganizationInfo,
  AnalyticsSourceData,
} from '../analytics.types'

const organization: AnalyticsOrganizationInfo = {
  id: 'org-1',
  name: 'Acme',
  slug: 'acme',
}

function createSourceData(
  overrides: Partial<AnalyticsSourceData> = {},
): AnalyticsSourceData {
  return {
    organization,
    orgUsers: [
      {
        user_id: 'user-1',
        role: 'member',
        status: 'active',
        joined_at: '2026-01-10T00:00:00.000Z',
        job_title: 'Sales',
        users: {
          id: 'user-1',
          username: 'ana',
          email: 'ana@example.com',
          first_name: 'Ana',
          last_name: 'Lopez',
          display_name: 'Ana Lopez',
          profile_picture_url: null,
          last_login_at: '2026-04-01T12:00:00.000Z',
        },
      },
      {
        user_id: 'user-2',
        role: 'member',
        status: 'active',
        joined_at: '2026-01-12T00:00:00.000Z',
        job_title: 'Support',
        users: {
          id: 'user-2',
          username: 'mario',
          email: 'mario@example.com',
          first_name: 'Mario',
          last_name: 'Perez',
          display_name: null,
          profile_picture_url: null,
          last_login_at: '2026-03-10T12:00:00.000Z',
        },
      },
    ],
    assignments: [
      {
        id: 'assignment-1',
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'completed',
        completion_percentage: 100,
        assigned_at: '2026-03-01T00:00:00.000Z',
        due_date: null,
        completed_at: '2026-03-20T00:00:00.000Z',
      },
      {
        id: 'assignment-2',
        user_id: 'user-2',
        course_id: 'course-2',
        status: 'in_progress',
        completion_percentage: 50,
        assigned_at: '2026-03-05T00:00:00.000Z',
        due_date: null,
        completed_at: null,
      },
    ],
    enrollments: [
      {
        enrollment_id: 'enroll-1',
        user_id: 'user-1',
        course_id: 'course-1',
        overall_progress_percentage: 100,
        enrollment_status: 'completed',
        completed_at: '2026-03-20T00:00:00.000Z',
        started_at: '2026-03-01T00:00:00.000Z',
      },
      {
        enrollment_id: 'enroll-2',
        user_id: 'user-2',
        course_id: 'course-2',
        overall_progress_percentage: 50,
        enrollment_status: 'active',
        completed_at: null,
        started_at: '2026-03-05T00:00:00.000Z',
      },
    ],
    certificates: [
      {
        certificate_id: 'cert-1',
        user_id: 'user-1',
        course_id: 'course-1',
        issued_at: '2026-03-20T00:00:00.000Z',
      },
    ],
    lessonProgress: [
      {
        progress_id: 'progress-1',
        user_id: 'user-1',
        lesson_id: 'lesson-1',
        enrollment_id: 'enroll-1',
        time_spent_minutes: 120,
        is_completed: true,
        completed_at: '2026-03-18T00:00:00.000Z',
        last_accessed_at: '2026-03-18T00:00:00.000Z',
        quiz_completed: true,
        quiz_passed: true,
      },
      {
        progress_id: 'progress-2',
        user_id: 'user-2',
        lesson_id: 'lesson-2',
        enrollment_id: 'enroll-2',
        time_spent_minutes: 30,
        is_completed: false,
        completed_at: null,
        last_accessed_at: '2026-03-10T00:00:00.000Z',
        quiz_completed: false,
        quiz_passed: false,
      },
    ],
    dailyProgress: [
      {
        user_id: 'user-1',
        progress_date: '2026-04-01',
        had_activity: true,
        streak_count: 5,
        study_minutes: 45,
        sessions_completed: 1,
        sessions_missed: 0,
      },
      {
        user_id: 'user-2',
        progress_date: '2026-03-01',
        had_activity: false,
        streak_count: 0,
        study_minutes: 0,
        sessions_completed: 0,
        sessions_missed: 0,
      },
    ],
    studySessions: [
      {
        id: 'session-1',
        user_id: 'user-1',
        start_time: '2026-04-01T08:00:00.000Z',
        actual_duration_minutes: 45,
        status: 'completed',
        completed_at: '2026-04-01T08:45:00.000Z',
        session_type: 'planner',
      },
      {
        id: 'session-2',
        user_id: 'user-2',
        start_time: '2026-03-10T09:00:00.000Z',
        actual_duration_minutes: 30,
        status: 'pending',
        completed_at: null,
        session_type: 'planner',
      },
    ],
    nodes: [
      {
        id: 'team-1',
        name: 'Equipo Norte',
        type: 'team',
        properties: {
          description: 'Equipo principal',
        },
        organization_node_users: [
          { user_id: 'user-1' },
          { user_id: 'user-2' },
        ],
      },
    ],
    activeSinceDate: '2026-03-03',
    ...overrides,
  }
}

function createRepositoryMock(): BusinessAnalyticsRepository {
  return {
    findOrganization: vi.fn(),
    fetchAnalyticsSourceData: vi.fn(),
  }
}

describe('BusinessAnalyticsService', () => {
  let repository: BusinessAnalyticsRepository
  let service: BusinessAnalyticsService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new BusinessAnalyticsService(repository)
  })

  it('builds analytics for an active organization', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(organization)
    vi.mocked(repository.fetchAnalyticsSourceData).mockResolvedValue(
      createSourceData(),
    )

    const result = await service.getAnalytics('org-1')

    expect(result.general_metrics).toMatchObject({
      total_users: 2,
      total_courses_assigned: 2,
      completed_courses: 1,
      active_users: 1,
      total_certificates: 1,
      retention_rate: 50,
    })
    expect(result.user_analytics[0]).toMatchObject({
      user_id: 'user-1',
      display_name: 'Ana Lopez',
      courses_completed: 1,
      total_time_minutes: 120,
    })
    expect(result.teams.total_teams).toBe(1)
    expect(result.teams.ranking[0]).toMatchObject({
      team_id: 'team-1',
      member_count: 2,
    })
  })

  it('exports user analytics to csv', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(organization)
    vi.mocked(repository.fetchAnalyticsSourceData).mockResolvedValue(
      createSourceData(),
    )

    const file = await service.exportAnalytics('org-1', 'users')

    expect(file.filename).toContain('acme-users.csv')
    expect(file.body).toContain('"user_id","display_name","email"')
    expect(file.body).toContain('"user-1","Ana Lopez","ana@example.com"')
  })

  it('throws when the organization does not exist', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(null)

    await expect(service.getAnalytics('missing-org')).rejects.toThrow(
      'Organizacion no encontrada',
    )
  })
})
