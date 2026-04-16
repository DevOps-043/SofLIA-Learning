import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'

const learningPathCreateSchema = z.object({
  title: z.string().trim().min(1, 'El titulo de la ruta es requerido'),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional(),
})

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const learningPaths = await AdminLearningPathsService.listLearningPaths()
    return NextResponse.json({ success: true, learningPaths })
  } catch (error) {
    logger.error('Error fetching learning paths:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener los learning paths' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = learningPathCreateSchema.parse(await request.json())
    const learningPath = await AdminLearningPathsService.createLearningPath(
      body,
      auth.userId,
    )

    return NextResponse.json({ success: true, learningPath }, { status: 201 })
  } catch (error) {
    logger.error('Error creating learning path:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al crear el learning path',
      },
      { status: 400 },
    )
  }
}
