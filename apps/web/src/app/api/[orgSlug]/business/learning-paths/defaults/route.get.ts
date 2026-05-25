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
