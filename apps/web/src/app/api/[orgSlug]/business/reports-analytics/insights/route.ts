import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  buildReportsAnalyticsInsightsFilename,
  generateReportsAnalyticsInsights,
  generateReportsAnalyticsInsightsPdf,
} from '@/features/business-panel/services/reports-analytics/reports-analytics.insights.service'
import { fetchReportsAnalyticsDataset } from '@/features/business-panel/services/reports-analytics/reports-analytics.server.service'
import type {
  ReportsAnalyticsFilters,
  ReportsAnalyticsLocale,
} from '@/features/business-panel/types/reports-analytics.types'
import {
  reportsAnalyticsInsightsSchema,
  type ReportsAnalyticsInsightsBody,
} from '../../_schemas'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

async function handlePost(
  _request: NextRequest,
  body: ReportsAnalyticsInsightsBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) return forbiddenResponse()

    const filters = normalizeFilters(body)
    const locale: ReportsAnalyticsLocale = body.locale || 'es'
    const supabase = await createClient()
    const dataset = await fetchReportsAnalyticsDataset(supabase, auth.organizationId, filters)
    const insights = await generateReportsAnalyticsInsights({
      dataset,
      locale,
      requestedByUserId: auth.userId,
    })

    if (body.format === 'pdf') {
      const pdf = await generateReportsAnalyticsInsightsPdf({ dataset, insights, locale })
      const responseBody = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer
      return new NextResponse(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${buildReportsAnalyticsInsightsFilename(dataset)}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      })
    }

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
    if (error instanceof ZodError) {
      return apiError('VALIDATION_ERROR', 'Filtros de analytics invalidos', 400)
    }

    logger.error('Reports analytics insights failed', error)
    return apiError('REPORT_INSIGHTS_FAILED', 'Error al generar analisis IA', 500)
  }
}

export const POST = withZodBody(reportsAnalyticsInsightsSchema, handlePost)

function normalizeFilters(
  input: ReportsAnalyticsInsightsBody,
): ReportsAnalyticsFilters {
  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setDate(defaultFrom.getDate() - 90)

  const from = normalizeDate(input.from, defaultFrom, false)
  const to = normalizeDate(input.to, now, true)

  return {
    from,
    to,
    granularity: input.granularity || 'month',
    courseId: input.courseId,
    gender: input.gender,
    ageBand: input.ageBand,
    jobTitle: input.jobTitle,
    role: input.role,
    status: input.status,
    regionId: input.regionId,
    zoneId: input.zoneId,
    teamId: input.teamId,
  }
}

function normalizeDate(value: string | undefined, fallback: Date, endOfDay: boolean): string {
  const date = value ? new Date(value) : new Date(fallback)
  if (Number.isNaN(date.getTime())) {
    throw new ZodError([])
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date.toISOString()
}

function forbiddenResponse(): NextResponse {
  return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
}
