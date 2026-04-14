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
    const learningPath = await AdminLearningPathsService.getLearningPathById(id)

    if (!learningPath) {
      return NextResponse.json(
        { success: false, error: 'Learning path no encontrado' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, learningPath })
  } catch (error) {
    logger.error('Error fetching learning path by id:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener el learning path' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()
    const learningPath = await AdminLearningPathsService.updateLearningPath(id, body)

    return NextResponse.json({ success: true, learningPath })
  } catch (error) {
    logger.error('Error updating learning path:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el learning path',
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
    await AdminLearningPathsService.deleteLearningPath(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting learning path:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el learning path' },
      { status: 500 },
    )
  }
}
