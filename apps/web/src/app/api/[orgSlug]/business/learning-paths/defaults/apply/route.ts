import { NextRequest, NextResponse } from 'next/server'

import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/utils/logger'
import {
  applyDefaultsSchema,
  type ApplyDefaultsBody,
} from '../../../_schemas'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

async function handlePost(
  _request: NextRequest,
  body: ApplyDefaultsBody,
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
        'No tienes permisos para aplicar rutas predeterminadas',
        403,
      )
    }

    const applyResult = await LearningPathDefaultsService.applyDefaultRules({
      organizationId: auth.organizationId,
      ruleIds: body.ruleIds,
      appliedBy: auth.userId,
    })

    return NextResponse.json({
      success: true,
      applyResult,
    })
  } catch (error) {
    logger.error('Error applying learning path default rules:', error)
    return apiError(
      'APPLY_LEARNING_PATH_DEFAULTS_FAILED',
      error instanceof Error ? error.message : 'Error al aplicar rutas predeterminadas',
      500,
    )
  }
}

export const POST = withZodBody(applyDefaultsSchema, handlePost, {
  emptyBodyFallback: {},
})
