import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'

import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = params
    const body = await request.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'UserId y CourseId son requeridos' },
        { status: 400 }
      )
    }

    const assignment = await AdminCompaniesService.assignCourseToUser(
      companyId,
      userId,
      courseId,
      auth.userId
    )

    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    logger.error('Error in POST /api/admin/companies/[id]/user-assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar curso al usuario' },
      { status: 500 }
    )
  }
}
