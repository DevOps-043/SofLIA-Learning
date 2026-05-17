import { z } from 'zod'

import { nonEmptyStringSchema } from '@/core/validation/common.schemas'

export const analyticsOrgIdParamsSchema = z.object({
  orgId: nonEmptyStringSchema,
})

export const analyticsExportScopeSchema = z.enum(['summary', 'users', 'teams'])

export const analyticsExportQuerySchema = z.object({
  scope: analyticsExportScopeSchema.default('users'),
})

export type AnalyticsExportScope = z.infer<typeof analyticsExportScopeSchema>
