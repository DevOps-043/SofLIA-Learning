import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { getBusinessUserAnalyticsInsights } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.insights.service'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type {
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '@/features/business-panel/types/business-user-analytics.types'
import { resolveAdminUserOrganizationId } from '@/features/admin/services/admin-user-analytics/resolve-org'

const adminUserInsightsSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
  organizationId: z.string().uuid().optional(),
})

type AdminUserInsightsBody = z.infer<typeof adminUserInsightsSchema>

type RouteContext = {
  params: Promise<{ id: string }>
}

async function handlePost(
  _request: NextRequest,
  body: AdminUserInsightsBody,
  { params }: RouteContext,
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const supabase = createBusinessUsersAdminClient()
    const organizationId = await resolveAdminUserOrganizationId(
      supabase,
      userId,
      body.organizationId,
    )

    if (!organizationId) {
      return apiError(
        'ADMIN_USER_ANALYTICS_NO_ORG',
        'El usuario no pertenece a ninguna organización',
        404,
      )
    }

    const range: BusinessUserAnalyticsRange = normalizeBusinessUserAnalyticsRange(body.range)
    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId,
      organizationId,
      range,
    })
    const insights = await getBusinessUserAnalyticsInsights({
      supabase,
      userId,
      organizationId,
      range,
      locale,
      dataset,
    })

    return NextResponse.json(
      { success: true, insights },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    )
  } catch (error) {
    logger.error('Admin user analytics insights failed', error)
    return apiError('ADMIN_USER_ANALYTICS_INSIGHTS_FAILED', 'Error al generar informe IA', 500)
  }
}

export const POST = withZodBody(adminUserInsightsSchema, handlePost)
