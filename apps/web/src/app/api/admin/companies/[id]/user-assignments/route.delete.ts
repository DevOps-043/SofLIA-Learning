import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'

import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'AssignmentId es requerido' },
        { status: 400 }
      )
    }

    await AdminCompaniesService.removeCourseFromUser(assignmentId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    logger.error('Error in DELETE /api/admin/companies/[id]/user-assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al revocar asignación del usuario' },
      { status: 500 }
    )
  }
}
