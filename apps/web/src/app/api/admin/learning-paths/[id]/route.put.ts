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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    const body = learningPathUpdateSchema.parse(await request.json())
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
