import { NextRequest, NextResponse } from 'next/server'

import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { logger } from '@/lib/utils/logger'

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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireOrgAdmin(orgSlug)
    if (auth instanceof NextResponse) return auth

    const [rules, nodes] = await Promise.all([
      CourseDefaultsService.listDefaultRules(auth.organizationId),
      CourseDefaultsService.listHierarchyNodeOptions(auth.organizationId),
    ])

    return NextResponse.json({
      success: true,
      rules,
      nodes,
    })
  } catch (error) {
    logger.error('Error fetching course default rules:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cursos predeterminados' },
      { status: 500 },
    )
  }
}
