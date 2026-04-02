import { NextResponse } from 'next/server'
import { requireBusiness } from '../../../../lib/auth/requireBusiness'
import { createClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/utils/logger'
import { buildGlobalAnalyticsResponse, getEmptyGlobalAnalyticsResponse } from '../../../../features/business-panel/services/analytics/global-analytics-response.service'
import { fetchGlobalAnalyticsQueryData } from '../../../../features/business-panel/services/analytics/global-analytics-query.service'

/**
 * GET /api/business/analytics
 * Obtiene analytics globales del dominio business.
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada',
        },
        { status: 403 },
      )
    }

    const supabase = await createClient()
    const data = await fetchGlobalAnalyticsQueryData(supabase, auth.organizationId)

    if (data.orgUsers.length === 0) {
      return NextResponse.json(getEmptyGlobalAnalyticsResponse())
    }

    return NextResponse.json(buildGlobalAnalyticsResponse(data))
  } catch (error) {
    logger.error('Error in /api/business/analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos de analytics',
      },
      { status: 500 },
    )
  }
}
