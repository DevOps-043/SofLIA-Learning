import { NextRequest, NextResponse } from 'next/server'

import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { normalizeBusinessUserAnalyticsRange } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import { getUserStatsDailyReport } from '@/features/business-panel/services/business-user-analytics/user-stats-daily-report.server.service'
import type { BusinessUserAnalyticsLocale } from '@/features/business-panel/types/business-user-analytics.types'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

import {
  dailyReportPdfResponse,
  userStatsPdfSchema,
  type UserStatsPdfBody,
} from '../../../../../_lib/daily-report-pdf'

export const maxDuration = 60

type RouteContext = {
  params: Promise<{ orgSlug: string; userId: string }>
}

/**
 * PDF de estadísticas de un miembro de la organización, pedido por un admin.
 *
 * Comparte documento diario con la ruta del propio usuario: el ámbito es
 * (usuario, organización, idioma, rango), no quién lo descarga, así que si el
 * empleado ya generó el suyo hoy el admin recibe ese mismo archivo.
 */
async function handlePost(
  _request: NextRequest,
  body: UserStatsPdfBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return forbidden('No tienes una organizacion asignada')
    }

    const supabase = createBusinessUsersAdminClient()
    const belongsToOrganization = await isOrganizationMember({
      supabase,
      organizationId: auth.organizationId,
      userId,
    })

    if (!belongsToOrganization) {
      return forbidden('Usuario no encontrado o no pertenece a tu organizacion')
    }

    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const document = await getUserStatsDailyReport({
      supabase,
      userId,
      organizationId: auth.organizationId,
      range: normalizeBusinessUserAnalyticsRange(body.range),
      locale,
      requestedByUserId: auth.userId,
    })

    return dailyReportPdfResponse(document)
  } catch (error) {
    logger.error('Business admin user stats PDF failed', error)
    return apiError('BUSINESS_USER_STATS_PDF_FAILED', 'Error al generar el informe', 500)
  }
}

async function isOrganizationMember({
  supabase,
  organizationId,
  userId,
}: {
  supabase: ReturnType<typeof createBusinessUsersAdminClient>
  organizationId: string
  userId: string
}): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('Business admin user stats PDF membership validation failed', {
      organizationId,
      userId,
      error,
    })
    return false
  }

  return Boolean(data)
}

function forbidden(message: string): NextResponse {
  return apiError('BUSINESS_USER_STATS_PDF_FORBIDDEN', message, 403)
}

export const POST = withZodBody(userStatsPdfSchema, handlePost)
