import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusiness } from '@/lib/auth/requireBusiness'
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

const businessAdminUserInsightsSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
})

type BusinessAdminUserInsightsBody = z.infer<typeof businessAdminUserInsightsSchema>

type RouteContext = {
  params: Promise<{ orgSlug: string; userId: string }>
}

async function handlePost(
  _request: NextRequest,
  body: BusinessAdminUserInsightsBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return forbiddenResponse('No tienes una organizacion asignada')
    }

    const supabase = createBusinessUsersAdminClient()
    const membership = await validateOrganizationUser({
      supabase,
      organizationId: auth.organizationId,
      userId,
    })

    if (!membership.ok) {
      return forbiddenResponse('Usuario no encontrado o no pertenece a tu organizacion')
    }

    const range: BusinessUserAnalyticsRange =
      normalizeBusinessUserAnalyticsRange(body.range)
    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId,
      organizationId: auth.organizationId,
      range,
    })
    const insights = await getBusinessUserAnalyticsInsights({
      supabase,
      userId,
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
    logger.error('Business user analytics admin insights failed', error)
    return apiError(
      'BUSINESS_USER_ANALYTICS_ADMIN_INSIGHTS_FAILED',
      'Error al generar informe IA',
      500,
    )
  }
}

async function validateOrganizationUser({
  supabase,
  organizationId,
  userId,
}: {
  supabase: ReturnType<typeof createBusinessUsersAdminClient>
  organizationId: string
  userId: string
}) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('Business user analytics admin insights membership validation failed', {
      organizationId,
      userId,
      error,
    })
  }

  return { ok: Boolean(data && !error) }
}

function forbiddenResponse(message: string): NextResponse {
  return apiError('BUSINESS_USER_ANALYTICS_ADMIN_FORBIDDEN', message, 403)
}

export const POST = withZodBody(businessAdminUserInsightsSchema, handlePost)
