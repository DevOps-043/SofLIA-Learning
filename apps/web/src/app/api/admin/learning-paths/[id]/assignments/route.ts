import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    const assignments = await AdminLearningPathsService.listAssignmentsForLearningPath(id)

    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    logger.error('Error fetching learning path assignments:', error)
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'LearningPathId invalido'
          : 'Error al obtener las asignaciones del learning path',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
