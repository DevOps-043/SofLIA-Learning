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

const ruleIdSchema = z.string().uuid('RuleId inválido')

const createRuleSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId inválido'),
  scopeType: z.enum(['organization', 'node']).default('organization'),
  nodeId: z.string().uuid('NodeId inválido').nullable().optional(),
  includeDescendants: z.boolean().optional(),
  applyNow: z.boolean().optional().default(true),
}).passthrough()

type CreateRuleBody = z.infer<typeof createRuleSchema>

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = await params
    const [rules, nodes] = await Promise.all([
      LearningPathDefaultsService.listDefaultRules(organizationId),
      LearningPathDefaultsService.listHierarchyNodeOptions(organizationId),
    ])

    return NextResponse.json({ success: true, rules, nodes })
  } catch (error) {
    logger.error('Error fetching learning path default rules (admin):', error)
    return apiError('ADMIN_LP_DEFAULTS_LIST_FAILED', 'Error al obtener rutas predeterminadas', 500)
  }
}

async function handlePost(
  _request: NextRequest,
  body: CreateRuleBody,
  { params }: RouteParams,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = await params

    const ruleId = await LearningPathDefaultsService.createOrReactivateDefaultRule({
      organizationId,
      learningPathId: body.learningPathId,
      scopeType: body.scopeType,
      nodeId: body.nodeId,
      includeDescendants: body.includeDescendants ?? true,
      createdBy: auth.userId,
    })

    const applyResult = body.applyNow
      ? await LearningPathDefaultsService.applyDefaultRules({
          organizationId,
          ruleIds: [ruleId],
          appliedBy: auth.userId,
        })
      : null

    return NextResponse.json({ success: true, ruleId, applyResult }, { status: 201 })
  } catch (error) {
    logger.error('Error creating learning path default rule (admin):', error)
    return apiError(
      'ADMIN_LP_DEFAULT_CREATE_FAILED',
      error instanceof Error ? error.message : 'Error al crear ruta predeterminada',
      500,
    )
  }
}

export const POST = withZodBody(createRuleSchema, handlePost)

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: organizationId } = await params
    const parsedRuleId = ruleIdSchema.parse(request.nextUrl.searchParams.get('ruleId'))

    await LearningPathDefaultsService.revokeDefaultRule({ organizationId, ruleId: parsedRuleId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking learning path default rule (admin):', error)
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', error.errors[0]?.message || 'RuleId inválido', 400)
    }
    return apiError('ADMIN_LP_DEFAULT_REVOKE_FAILED', 'Error al desactivar ruta predeterminada', 500)
  }
}
