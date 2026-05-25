import { NextRequest, NextResponse } from 'next/server'

import { getBusinessUserAnalyticsInsights } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.insights.service'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type {
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '@/features/business-panel/types/business-user-analytics.types'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  businessUserInsightsSchema,
  type BusinessUserInsightsBody,
} from './schema'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

async function handlePost(
  _request: NextRequest,
  body: BusinessUserInsightsBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) return forbiddenResponse()

    const range: BusinessUserAnalyticsRange =
      normalizeBusinessUserAnalyticsRange(body.range)
    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const supabase = await createClient()
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId: auth.userId,
      organizationId: auth.organizationId,
      range,
    })
    const insights = await getBusinessUserAnalyticsInsights({
      supabase,
      userId: auth.userId,
      organizationId: auth.organizationId,
      range,
      locale,
      dataset,
    })

    return NextResponse.json(
      {
        success: true,
        insights,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    )
  } catch (error) {
    logger.error('Business user analytics insights failed', error)
    return apiError(
      'BUSINESS_USER_ANALYTICS_INSIGHTS_FAILED',
      'Error al generar informe IA',
      500,
    )
  }
}

function forbiddenResponse(): NextResponse {
  return apiError(
    'BUSINESS_USER_ORGANIZATION_REQUIRED',
    'No tienes una organizacion asignada',
    403,
  )
}

export const POST = withZodBody(businessUserInsightsSchema, handlePost)
