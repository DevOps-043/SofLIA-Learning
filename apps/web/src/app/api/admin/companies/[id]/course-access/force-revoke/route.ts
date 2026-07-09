import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { withZodBody } from '@/lib/api/with-validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

const forceRevokeSchema = z.object({
  userId: z.string().uuid('UserId invalido'),
  courseIds: z.array(z.string().uuid('CourseId invalido')).min(1, 'Selecciona al menos un curso'),
})

type ForceRevokeBody = z.infer<typeof forceRevokeSchema>

async function handlePost(
  _request: NextRequest,
  body: ForceRevokeBody,
  { params }: RouteParams,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = await params
    const result = await AdminLearningPathsService.forceRevokeCourseAccess(
      body.userId,
      organizationId,
      body.courseIds,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error('Error force-revoking course access (admin):', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al revocar el acceso a los cursos',
      },
      { status: 500 },
    )
  }
}

export const POST = withZodBody(forceRevokeSchema, handlePost)
