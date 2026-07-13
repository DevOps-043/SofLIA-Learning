import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { getLearningPathManagementBootstrap } from '@/features/admin/services/admin-learning-paths/management-bootstrap.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { apiError } from '@/lib/api/errors'
import { logger } from '@/lib/utils/logger'

const paramsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Bootstrap agregado de la página de gestión de un learning path.
 * Sustituye 4 GETs paralelos del cliente por una sola invocación
 * (ver management-bootstrap.service.ts).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: learningPathId } = paramsSchema.parse(await params)
    const bootstrap = await getLearningPathManagementBootstrap(learningPathId)

    if (!bootstrap.learningPath) {
      return apiError('ADMIN_LEARNING_PATH_NOT_FOUND', 'Learning path no encontrado', 404)
    }

    return NextResponse.json({ success: true, ...bootstrap })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', error.errors[0]?.message || 'LearningPathId invalido', 400)
    }

    logger.error('Error fetching learning path management bootstrap:', error)
    return apiError(
      'ADMIN_LEARNING_PATH_BOOTSTRAP_FAILED',
      'Error al cargar la información del learning path',
      500,
    )
  }
}
