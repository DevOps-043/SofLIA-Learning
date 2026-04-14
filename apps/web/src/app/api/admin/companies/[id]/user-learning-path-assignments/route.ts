import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const assignments = await AdminLearningPathsService.listUserAssignments(id)

    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    logger.error('Error fetching user learning path assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener asignaciones individuales de learning paths' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()

    if (!body.userId || !body.learningPathId) {
      return NextResponse.json(
        { success: false, error: 'UserId y LearningPathId son requeridos' },
        { status: 400 },
      )
    }

    const assignment = await AdminLearningPathsService.assignToUser(
      id,
      body.userId,
      body.learningPathId,
      auth.userId,
    )

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error) {
    logger.error('Error assigning learning path to user:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al asignar learning path al usuario',
      },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const assignmentId = request.nextUrl.searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'AssignmentId es requerido' },
        { status: 400 },
      )
    }

    await AdminLearningPathsService.revokeFromUser(id, assignmentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking user learning path assignment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al revocar la asignación individual del learning path',
      },
      { status: 500 },
    )
  }
}
