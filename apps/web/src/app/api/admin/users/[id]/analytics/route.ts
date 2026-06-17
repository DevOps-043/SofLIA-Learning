import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { resolveAdminUserOrganizationId } from '@/features/admin/services/admin-user-analytics/resolve-org'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const supabase = createBusinessUsersAdminClient()
    const preferredOrganizationId = request.nextUrl.searchParams.get('organizationId')
    const organizationId = await resolveAdminUserOrganizationId(
      supabase,
      userId,
      preferredOrganizationId,
    )

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'El usuario no pertenece a ninguna organización' },
        { status: 404 },
      )
    }

    const range = normalizeBusinessUserAnalyticsRange(request.nextUrl.searchParams.get('range'))
    // Vista de superadmin ACOTADA por organización: un usuario puede pertenecer a
    // varias organizaciones con progreso/estadísticas distintas. La organización se
    // resuelve desde `?organizationId=` (validada contra las del usuario) o la
    // primera; `includeAllUserEnrollments` queda en su default (false) para no
    // mezclar la actividad de otras organizaciones.
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId,
      organizationId,
      range,
    })
    const { aiSamples: _aiSamples, dataHash: _dataHash, ...publicDataset } = dataset

    return NextResponse.json(publicDataset satisfies BusinessUserAnalyticsResponse, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('Admin user analytics GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas del usuario' },
      { status: 500 },
    )
  }
}
