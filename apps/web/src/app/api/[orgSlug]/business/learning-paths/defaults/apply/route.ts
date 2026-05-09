import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

const applyDefaultsSchema = z.object({
  ruleIds: z.array(z.string().uuid('RuleId invalido')).optional(),
})

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organizacion asignada' },
        { status: 403 },
      )
    }

    if (!auth.isOrgAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para aplicar rutas predeterminadas' },
        { status: 403 },
      )
    }

    const body = applyDefaultsSchema.parse(await request.json().catch(() => ({})))
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
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'Solicitud invalida'
          : error instanceof Error
            ? error.message
            : 'Error al aplicar rutas predeterminadas',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
