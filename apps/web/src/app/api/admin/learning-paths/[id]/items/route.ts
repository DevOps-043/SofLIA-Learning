import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()

    if (!body.courseId) {
      return NextResponse.json(
        { success: false, error: 'CourseId es requerido' },
        { status: 400 },
      )
    }

    const item = await AdminLearningPathsService.addItem(id, body.courseId)
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    logger.error('Error adding learning path item:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al agregar el taller al learning path',
      },
      { status: 400 },
    )
  }
}
