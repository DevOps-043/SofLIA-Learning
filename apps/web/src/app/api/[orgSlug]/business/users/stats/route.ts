import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'

/**
 * GET /api/[orgSlug]/business/users/stats
 * Obtiene estadísticas globales de usuarios filtradas por organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    
    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }
    
    const stats = await BusinessUsersServerService.getOrganizationStats(auth.organizationId)

    return NextResponse.json({
      success: true,
      stats: stats || {}
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/users/stats:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error al obtener estadísticas'
    }, { status: 500 })
  }
}
