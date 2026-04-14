import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await request.json()
    const orderedItemIds = Array.isArray(body.orderedItemIds)
      ? body.orderedItemIds.filter((value: unknown): value is string => typeof value === 'string')
      : []

    const learningPath = await AdminLearningPathsService.reorderItems(
      id,
      orderedItemIds,
    )

    return NextResponse.json({ success: true, learningPath })
  } catch (error) {
    logger.error('Error reordering learning path items:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al reordenar el learning path',
      },
      { status: 400 },
    )
  }
}
