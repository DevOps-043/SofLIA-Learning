import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { logger } from '@/lib/utils/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const companyId = params.id

  try {
    const stats = await AdminCompaniesService.getCompanyDetailedStats(companyId)
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    logger.error(`❌ Error in GET /api/admin/companies/${companyId}/stats:`, error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
