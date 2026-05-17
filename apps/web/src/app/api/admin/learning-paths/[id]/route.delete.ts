import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { logger } from '@/lib/utils/logger'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const learningPathUpdateSchema = z.object({
  title: z.string().trim().min(1, 'El titulo de la ruta es requerido').optional(),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional(),
})

const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    await AdminLearningPathsService.deleteLearningPath(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting learning path:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'LearningPathId invalido'
          : 'Error al eliminar el learning path',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
