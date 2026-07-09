import { NextRequest, NextResponse } from 'next/server'

import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/utils/logger'
import {
  forceRevokeCourseAccessSchema,
  type ForceRevokeCourseAccessBody,
} from '../../_schemas'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

async function handlePost(
  _request: NextRequest,
  body: ForceRevokeCourseAccessBody,
  { params }: RouteParams,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para revocar acceso a cursos en esta organizacion',
        403,
      )
    }

    const result = await AdminLearningPathsService.forceRevokeCourseAccess(
      body.userId,
      auth.organizationId,
      body.courseIds,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error('Error force-revoking course access (business panel):', error)
    return apiError(
      'FORCE_REVOKE_COURSE_ACCESS_FAILED',
      error instanceof Error ? error.message : 'Error al revocar el acceso a los cursos',
      500,
    )
  }
}

export const POST = withZodBody(forceRevokeCourseAccessSchema, handlePost)
