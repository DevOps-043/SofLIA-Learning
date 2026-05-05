import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import { getBusinessUserAnalyticsInsights } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.insights.service'
import type {
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '@/features/business-panel/types/business-user-analytics.types'

const insightsSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) return forbiddenResponse()

    const parsed = insightsSchema.parse(await request.json())
    const range: BusinessUserAnalyticsRange = normalizeBusinessUserAnalyticsRange(parsed.range)
    const locale: BusinessUserAnalyticsLocale = parsed.locale || 'es'
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parametros de analytics invalidos' },
        { status: 400 },
      )
    }

    logger.error('Business user analytics insights failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar informe IA' },
      { status: 500 },
    )
  }
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'No tienes una organizacion asignada' },
    { status: 403 },
  )
}
