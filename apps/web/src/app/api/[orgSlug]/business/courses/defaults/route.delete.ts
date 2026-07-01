import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { logger } from '@/lib/utils/logger'

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
      { success: false, error: 'No tienes permisos para gestionar cursos predeterminados' },
      { status: 403 },
    )
  }

  return auth
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const ruleId = request.nextUrl.searchParams.get('ruleId')
    const parsedRuleId = ruleIdSchema.parse(ruleId)

    await CourseDefaultsService.revokeDefaultRule({
      organizationId: auth.organizationId,
      ruleId: parsedRuleId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking course default rule:', error)
    const isValidationError = error instanceof z.ZodError

    return NextResponse.json(
      {
        success: false,
        error: isValidationError
          ? error.errors[0]?.message || 'RuleId invalido'
          : 'Error al desactivar curso predeterminado',
      },
      { status: isValidationError ? 400 : 500 },
    )
  }
}
