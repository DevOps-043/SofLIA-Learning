import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: companyId } = params
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
