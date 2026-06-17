import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { listAdminUserOrganizations } from '@/features/admin/services/admin-user-analytics/list-user-organizations'

/**
 * Organizaciones (activas) a las que pertenece un usuario. Alimenta el selector
 * de organización de las estadísticas del superadministrador, que permite ver las
 * métricas del usuario acotadas a una organización concreta.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: userId } = await params
    const supabase = createBusinessUsersAdminClient()
    const organizations = await listAdminUserOrganizations(supabase, userId)

    return NextResponse.json(
      { success: true, organizations },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
    )
  } catch (error) {
    logger.error('Admin user organizations GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener las organizaciones del usuario' },
      { status: 500 },
    )
  }
}
