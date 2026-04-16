import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const learningPathItemParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
  itemId: z.string().uuid('ItemId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id, itemId } = learningPathItemParamsSchema.parse(await params)
    await AdminLearningPathsService.removeItem(id, itemId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting learning path item:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al eliminar el taller del learning path',
      },
      { status: 400 },
    )
  }
}
