import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'

import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = await params
    const assignments = await AdminCompaniesService.getUserCourseAssignments(companyId)

    return NextResponse.json({
      success: true,
      assignments
    })
  } catch (error) {
    logger.error('Error in GET /api/admin/companies/[id]/user-assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener asignaciones individuales' },
      { status: 500 }
    )
  }
}
