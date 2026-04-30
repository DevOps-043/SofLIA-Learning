import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireBusiness } from '@/lib/auth/requireBusiness'
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

const optionalFilterSchema = z.string().trim().min(1).max(160).optional()

const analyticsInsightsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(['day', 'month', 'year']).optional(),
  courseId: optionalFilterSchema,
  gender: optionalFilterSchema,
  ageBand: optionalFilterSchema,
  jobTitle: optionalFilterSchema,
  role: optionalFilterSchema,
  status: optionalFilterSchema,
  regionId: optionalFilterSchema,
  zoneId: optionalFilterSchema,
  teamId: optionalFilterSchema,
  locale: z.enum(['es', 'en', 'pt']).optional(),
  format: z.enum(['json', 'pdf']).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) return forbiddenResponse()

    const body = await request.json()
    const parsed = analyticsInsightsSchema.parse(body)
    const filters = normalizeFilters(parsed)
    const locale: ReportsAnalyticsLocale = parsed.locale || 'es'
    const supabase = await createClient()
    const dataset = await fetchReportsAnalyticsDataset(supabase, auth.organizationId, filters)
    const insights = await generateReportsAnalyticsInsights({
      dataset,
      locale,
      requestedByUserId: auth.userId,
    })

    if (parsed.format === 'pdf') {
      const pdf = await generateReportsAnalyticsInsightsPdf({ dataset, insights, locale })
      const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer
      return new NextResponse(body, {
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Filtros de analytics invalidos' },
        { status: 400 },
      )
    }

    logger.error('Reports analytics insights failed')
    return NextResponse.json(
      { success: false, error: 'Error al generar analisis IA' },
      { status: 500 },
    )
  }
}

function normalizeFilters(
  input: z.infer<typeof analyticsInsightsSchema>,
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
    throw new z.ZodError([])
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date.toISOString()
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'No tienes una organizacion asignada' },
    { status: 403 },
  )
}
