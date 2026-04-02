import type { Request, RequestHandler, Response } from 'express'

import { asyncHandler } from '@/core/middleware/error.middleware'

import { BusinessAnalyticsService } from './analytics.service'
import type { AnalyticsExportScope } from './analytics.types'

interface BusinessAnalyticsController {
  getAnalytics: RequestHandler
  getTeamAnalytics: RequestHandler
  exportAnalytics: RequestHandler
}

export function createBusinessAnalyticsController(
  service: BusinessAnalyticsService = new BusinessAnalyticsService(),
): BusinessAnalyticsController {
  return {
    getAnalytics: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getAnalytics(req.params.orgId)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    getTeamAnalytics: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getTeamAnalytics(req.params.orgId)

      res.status(200).json({
        success: true,
        data: result,
      })
    }),

    exportAnalytics: asyncHandler(async (req: Request, res: Response) => {
      const exportFile = await service.exportAnalytics(
        req.params.orgId,
        req.query.scope as AnalyticsExportScope,
      )

      res.setHeader('Content-Type', exportFile.contentType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportFile.filename}"`,
      )
      res.status(200).send(exportFile.body)
    }),
  }
}
