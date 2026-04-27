import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  fetchReportsAnalyticsDataset,
} from '@/features/business-panel/services/reports-analytics/reports-analytics.server.service'
import {
  buildReportsAnalyticsFilename,
  generateReportsAnalyticsPdf,
  generateReportsAnalyticsWorkbook,
  generateReportsAnalyticsZip,
} from '@/features/business-panel/services/reports-analytics/reports-analytics.export.service'
import type {
  ReportsAnalyticsFilters,
} from '@/features/business-panel/types/reports-analytics.types'

const optionalFilterSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .optional()

const analyticsQuerySchema = z.object({
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
})

const analyticsExportSchema = analyticsQuerySchema.extend({
  format: z.enum(['csv_zip', 'xlsx', 'pdf']),
  locale: z.enum(['es', 'en', 'pt']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) return forbiddenResponse()

    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams)
    const supabase = await createClient()
    const dataset = await fetchReportsAnalyticsDataset(supabase, auth.organizationId, filters)
    const { userDetails: _userDetails, aiSamples: _aiSamples, ...publicDataset } = dataset

    return NextResponse.json(publicDataset, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('Reports analytics GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener analytics' },
      { status: 500 },
    )
  }
}

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
    const parsed = analyticsExportSchema.parse(body)
    const filters = normalizeFilters(parsed)
    const supabase = await createClient()
    const dataset = await fetchReportsAnalyticsDataset(supabase, auth.organizationId, filters)
    const locale = parsed.locale || 'es'

    if (parsed.format === 'pdf') {
      const file = await generateReportsAnalyticsPdf(dataset, locale)
      return buildFileResponse(file, buildReportsAnalyticsFilename('pdf', dataset), 'application/pdf')
    }

    if (parsed.format === 'xlsx') {
      const file = await generateReportsAnalyticsWorkbook(dataset, locale)
      return buildFileResponse(
        file,
        buildReportsAnalyticsFilename('xlsx', dataset),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    }

    const file = await generateReportsAnalyticsZip(dataset, locale)
    return buildFileResponse(file, buildReportsAnalyticsFilename('zip', dataset), 'application/zip')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Filtros de analytics invalidos' },
        { status: 400 },
      )
    }

    logger.error('Reports analytics export failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte' },
      { status: 500 },
    )
  }
}

function parseFiltersFromSearchParams(searchParams: URLSearchParams): ReportsAnalyticsFilters {
  const parsed = analyticsQuerySchema.parse({
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    granularity: searchParams.get('granularity') || undefined,
    courseId: searchParams.get('courseId') || undefined,
    gender: searchParams.get('gender') || undefined,
    ageBand: searchParams.get('ageBand') || undefined,
    jobTitle: searchParams.get('jobTitle') || undefined,
    role: searchParams.get('role') || undefined,
    status: searchParams.get('status') || undefined,
    regionId: searchParams.get('regionId') || undefined,
    zoneId: searchParams.get('zoneId') || undefined,
    teamId: searchParams.get('teamId') || undefined,
  })

  return normalizeFilters(parsed)
}

function normalizeFilters(
  input: z.infer<typeof analyticsQuerySchema>,
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

function buildFileResponse(
  file: Uint8Array,
  filename: string,
  contentType: string,
): NextResponse {
  const body = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'No tienes una organizacion asignada' },
    { status: 403 },
  )
}
