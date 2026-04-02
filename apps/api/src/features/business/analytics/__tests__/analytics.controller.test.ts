import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createBusinessAnalyticsController } from '../analytics.controller'

function createResponse() {
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

describe('business analytics controller', () => {
  it('returns analytics payloads', async () => {
    const service = {
      getAnalytics: vi.fn().mockResolvedValue({
        organization: {
          id: 'org-1',
          name: 'Acme',
          slug: 'acme',
        },
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
        course_metrics: {
          distribution: [],
        },
        engagement_metrics: {
          stickiness: [],
          frequency: [],
          streaks: [],
          heatmap: [],
          duration: [],
        },
        teams: {
          total_teams: 0,
          teams: [],
          ranking: [],
        },
      }),
      getTeamAnalytics: vi.fn(),
      exportAnalytics: vi.fn(),
    }
    const controller = createBusinessAnalyticsController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.getAnalytics(
      {
        params: {
          orgId: 'org-1',
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(service.getAnalytics).toHaveBeenCalledWith('org-1')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('exports analytics as csv attachments', async () => {
    const service = {
      getAnalytics: vi.fn(),
      getTeamAnalytics: vi.fn(),
      exportAnalytics: vi.fn().mockResolvedValue({
        filename: 'analytics.csv',
        contentType: 'text/csv; charset=utf-8',
        body: 'a,b\n1,2',
      }),
    }
    const controller = createBusinessAnalyticsController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.exportAnalytics(
      {
        params: {
          orgId: 'org-1',
        },
        query: {
          scope: 'users',
        },
      } as unknown as Request,
      response,
      next,
    )

    expect(service.exportAnalytics).toHaveBeenCalledWith('org-1', 'users')
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8',
    )
    expect(response.send).toHaveBeenCalledWith('a,b\n1,2')
    expect(next).not.toHaveBeenCalled()
  })
})
