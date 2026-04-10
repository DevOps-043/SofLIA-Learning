import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { fetchBusinessUserStatsData } from '@/features/business-panel/services/business-user-stats-query.service'
import { buildBusinessUserStatsResponse } from '@/features/business-panel/services/business-user-stats-response.service'

/**
 * GET /api/[orgSlug]/business/users/[userId]/stats
 * Obtiene estadísticas de aprendizaje de un usuario dentro de la organización.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> }
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
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
        { success: false, error: result.error },
        { status: 403 },
      )
    }

    if (result.status === 'not_found') {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      )
    }

    return NextResponse.json(buildBusinessUserStatsResponse(result.data))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener estadísticas'
    logger.error('Error in /api/[orgSlug]/business/users/[userId]/stats:', { message })

    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas del usuario' },
      { status: 500 }
    )
  }
}
