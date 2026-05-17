import type { Response } from 'express'
import { vi } from 'vitest'

export function createResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  }

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    setHeader: ReturnType<typeof vi.fn>
  }
}

export function createAnalyticsPayload() {
  return {
    organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
    general_metrics: {
      total_users: 1,
      total_courses_assigned: 1,
      completed_courses: 1,
      average_progress: 100,
      total_time_hours: 2,
      total_certificates: 1,
      active_users: 1,
      retention_rate: 100,
    },
    user_analytics: [],
    trends: {
      enrollments_by_month: [],
      completions_by_month: [],
      time_by_month: [],
      active_users_by_month: [],
    },
    by_role: {
      distribution: [],
      progress_comparison: [],
      completions: [],
      time_spent: [],
    },
    course_metrics: { distribution: [] },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
    teams: { total_teams: 0, teams: [], ranking: [] },
  }
}

export function createAnalyticsServiceMock() {
  return {
    getAnalytics: vi.fn().mockResolvedValue(createAnalyticsPayload()),
    getTeamAnalytics: vi.fn(),
    exportAnalytics: vi.fn().mockResolvedValue({
      filename: 'analytics.csv',
      contentType: 'text/csv; charset=utf-8',
      body: 'a,b\n1,2',
    }),
  }
}
