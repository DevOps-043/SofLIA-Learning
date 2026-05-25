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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
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
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'LearningPathId invalido'
          : 'Error al obtener el learning path',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
