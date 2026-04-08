import { NextResponse } from 'next/server'
import { requireBusiness } from '../../../../../../lib/auth/requireBusiness'
import { logger } from '../../../../../../lib/utils/logger'
import { buildBusinessUserStatsResponse } from '../../../../../../features/business-panel/services/business-user-stats-response.service'
import { fetchBusinessUserStatsData } from '../../../../../../features/business-panel/services/business-user-stats-query.service'
import { createBusinessUsersAdminClient } from '../../../../../../features/business-panel/services/business-users-server/client'

interface RouteContext {
  params: Promise<{ userId: string }>
}

/**
 * GET /api/business/users/[userId]/stats
 * Obtiene estadísticas completas de un usuario de la organización.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { userId } = await context.params

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada',
        },
        { status: 403 },
      )
    }

    const supabase = createBusinessUsersAdminClient()
    const result = await fetchBusinessUserStatsData(
      supabase,
      auth.organizationId,
      userId,
    )

    if (result.status === 'forbidden') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 403 },
      )
    }

    if (result.status === 'not_found') {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(buildBusinessUserStatsResponse(result.data))
  } catch (error) {
    logger.error('Error in /api/business/users/[userId]/stats:', error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Error al obtener estadísticas del usuario'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
