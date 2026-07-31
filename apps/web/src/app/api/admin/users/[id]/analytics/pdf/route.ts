import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { resolveAdminUserOrganizationId } from '@/features/admin/services/admin-user-analytics/resolve-org'
import { normalizeBusinessUserAnalyticsRange } from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import { getUserStatsDailyReport } from '@/features/business-panel/services/business-user-analytics/user-stats-daily-report.server.service'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import type { BusinessUserAnalyticsLocale } from '@/features/business-panel/types/business-user-analytics.types'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import { dailyReportPdfResponse } from '@/app/api/[orgSlug]/_lib/daily-report-pdf'

export const maxDuration = 60

const adminUserStatsPdfSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
  organizationId: z.string().uuid().optional(),
})

type AdminUserStatsPdfBody = z.infer<typeof adminUserStatsPdfSchema>

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PDF de estadísticas de un usuario visto desde el panel de super-admin.
 *
 * Comparte el documento diario con las rutas de organización: el ámbito es
 * (usuario, organización, idioma, rango), así que el super-admin recibe el mismo
 * archivo que ya se hubiera generado hoy en lugar de gastar otro análisis.
 */
async function handlePost(
  _request: NextRequest,
  body: AdminUserStatsPdfBody,
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

    const locale: BusinessUserAnalyticsLocale = body.locale || 'es'
    const document = await getUserStatsDailyReport({
      supabase,
      userId,
      organizationId,
      range: normalizeBusinessUserAnalyticsRange(body.range),
      locale,
      requestedByUserId: auth.userId,
    })

    return dailyReportPdfResponse(document)
  } catch (error) {
    logger.error('Admin user stats PDF failed', error)
    return apiError('ADMIN_USER_STATS_PDF_FAILED', 'Error al generar el informe', 500)
  }
}

export const POST = withZodBody(adminUserStatsPdfSchema, handlePost)
