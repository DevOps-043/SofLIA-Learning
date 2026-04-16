import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const reorderLearningPathItemsSchema = z.object({
  orderedItemIds: z.array(z.string().uuid('ItemId invalido')).min(1),
})
const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    const body = reorderLearningPathItemsSchema.parse(await request.json())

    const learningPath = await AdminLearningPathsService.reorderItems(
      id,
      body.orderedItemIds,
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
