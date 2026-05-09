import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

const createDefaultRuleSchema = z.object({
  learningPathId: z.string().uuid('LearningPathId invalido'),
  scopeType: z.enum(['organization', 'node']).default('organization'),
  nodeId: z.string().uuid('NodeId invalido').nullable().optional(),
  includeDescendants: z.boolean().optional(),
  applyNow: z.boolean().optional().default(true),
})

const ruleIdSchema = z.string().uuid('RuleId invalido')

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

async function requireOrgAdmin(orgSlug: string) {
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
      { success: false, error: 'No tienes permisos para gestionar rutas predeterminadas' },
      { status: 403 },
    )
  }

  return auth
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const [rules, nodes] = await Promise.all([
      LearningPathDefaultsService.listDefaultRules(auth.organizationId),
      LearningPathDefaultsService.listHierarchyNodeOptions(auth.organizationId),
    ])

    return NextResponse.json({
      success: true,
      rules,
      nodes,
    })
  } catch (error) {
    logger.error('Error fetching learning path default rules:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rutas predeterminadas' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const body = createDefaultRuleSchema.parse(await request.json())
    const ruleId = await LearningPathDefaultsService.createOrReactivateDefaultRule({
      organizationId: auth.organizationId,
      learningPathId: body.learningPathId,
      scopeType: body.scopeType,
      nodeId: body.nodeId,
      includeDescendants: body.includeDescendants ?? true,
      createdBy: auth.userId,
    })

    const applyResult = body.applyNow
      ? await LearningPathDefaultsService.applyDefaultRules({
          organizationId: auth.organizationId,
          ruleIds: [ruleId],
          appliedBy: auth.userId,
        })
      : null

    return NextResponse.json({
      success: true,
      ruleId,
      applyResult,
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating learning path default rule:', error)
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'Solicitud invalida'
          : error instanceof Error
            ? error.message
            : 'Error al crear ruta predeterminada',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const ruleId = request.nextUrl.searchParams.get('ruleId')
    const parsedRuleId = ruleIdSchema.parse(ruleId)

    await LearningPathDefaultsService.revokeDefaultRule({
      organizationId: auth.organizationId,
      ruleId: parsedRuleId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking learning path default rule:', error)
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'RuleId invalido'
          : 'Error al desactivar ruta predeterminada',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
