import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const addLearningPathItemSchema = z.object({
  courseId: z.string().uuid('CourseId invalido'),
})
const learningPathParamsSchema = z.object({
  id: z.string().uuid('LearningPathId invalido'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = learningPathParamsSchema.parse(await params)
    const body = addLearningPathItemSchema.parse(await request.json())

    const item = await AdminLearningPathsService.addItem(id, body.courseId, auth.userId)
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
