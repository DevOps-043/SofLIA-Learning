import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

const applySchema = z.object({
  ruleIds: z.array(z.string().uuid('RuleId inválido')).optional(),
}).passthrough()

type ApplyBody = z.infer<typeof applySchema>

async function handlePost(
  _request: NextRequest,
  body: ApplyBody,
  { params }: RouteParams,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = await params

    const applyResult = await LearningPathDefaultsService.applyDefaultRules({
      organizationId,
      ruleIds: body.ruleIds,
      appliedBy: auth.userId,
    })

    return NextResponse.json({ success: true, applyResult })
  } catch (error) {
    logger.error('Error applying learning path default rules (admin):', error)
    return apiError(
      'ADMIN_LP_DEFAULTS_APPLY_FAILED',
      error instanceof Error ? error.message : 'Error al aplicar rutas predeterminadas',
      500,
    )
  }
}

export const POST = withZodBody(applySchema, handlePost, { emptyBodyFallback: {} })
