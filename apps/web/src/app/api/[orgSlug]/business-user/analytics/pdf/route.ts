import { NextRequest, NextResponse } from 'next/server'

import { getUserStatsDailyReport } from '@/features/business-panel/services/business-user-analytics/user-stats-daily-report.server.service'
import { normalizeBusinessUserAnalyticsRange } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type { BusinessUserAnalyticsLocale } from '@/features/business-panel/types/business-user-analytics.types'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

import {
  dailyReportPdfResponse,
  userStatsPdfSchema,
  type UserStatsPdfBody,
} from '../../../_lib/daily-report-pdf'

// Generar el informe implica consultar datos y pedir el análisis a SofLIA; el
// timeout por defecto de la plataforma (~10s) se queda corto.
export const maxDuration = 60

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/** PDF de estadísticas del propio usuario, uno por día natural. */
async function handlePost(
  _request: NextRequest,
  body: UserStatsPdfBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return apiError(
        'BUSINESS_USER_ORGANIZATION_REQUIRED',
        'No tienes una organizacion asignada',
        403,
      )
    }

    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const document = await getUserStatsDailyReport({
      supabase: createAdminClient(),
      userId: auth.userId,
      organizationId: auth.organizationId,
      range: normalizeBusinessUserAnalyticsRange(body.range),
      locale,
      requestedByUserId: auth.userId,
    })

    return dailyReportPdfResponse(document)
  } catch (error) {
    logger.error('Business user stats PDF failed', error)
    return apiError('BUSINESS_USER_STATS_PDF_FAILED', 'Error al generar el informe', 500)
  }
}

export const POST = withZodBody(userStatsPdfSchema, handlePost)
