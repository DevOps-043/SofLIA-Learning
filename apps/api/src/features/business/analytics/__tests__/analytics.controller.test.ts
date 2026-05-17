import type { Request } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createBusinessAnalyticsController } from '../analytics.controller'
import {
  createAnalyticsServiceMock,
  createResponse,
} from './analytics.controller.fixtures'

describe('business analytics controller', () => {
  it('returns analytics payloads', async () => {
    const service = createAnalyticsServiceMock()
    const controller = createBusinessAnalyticsController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.getAnalytics(
      { params: { orgId: 'org-1' } } as unknown as Request,
      response,
      next,
    )

    expect(service.getAnalytics).toHaveBeenCalledWith('org-1')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('exports analytics as csv attachments', async () => {
    const service = createAnalyticsServiceMock()
    const controller = createBusinessAnalyticsController(service as never)
    const response = createResponse()
    const next = vi.fn()

    await controller.exportAnalytics(
      {
        params: { orgId: 'org-1' },
        query: { scope: 'users' },
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
