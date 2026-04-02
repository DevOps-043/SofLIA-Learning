import { Router } from 'express'

import { authenticate } from '@/core/middleware/auth.middleware'
import { requireOrganizationAccess } from '@/core/middleware/organization-access.middleware'
import { validateRequest } from '@/core/validation/validate.middleware'

import { createBusinessAnalyticsController } from './analytics.controller'
import {
  analyticsExportQuerySchema,
  analyticsOrgIdParamsSchema,
} from './analytics.types'

export function createBusinessAnalyticsRouter() {
  const router = Router()
  const controller = createBusinessAnalyticsController()

  router.use(authenticate)

  router.get(
    '/:orgId/analytics',
    validateRequest({ params: analyticsOrgIdParamsSchema }),
    requireOrganizationAccess(),
    controller.getAnalytics,
  )
  router.get(
    '/:orgId/analytics/teams',
    validateRequest({ params: analyticsOrgIdParamsSchema }),
    requireOrganizationAccess(),
    controller.getTeamAnalytics,
  )
  router.get(
    '/:orgId/analytics/export',
    validateRequest({
      params: analyticsOrgIdParamsSchema,
      query: analyticsExportQuerySchema,
    }),
    requireOrganizationAccess(),
    controller.exportAnalytics,
  )

  return router
}
