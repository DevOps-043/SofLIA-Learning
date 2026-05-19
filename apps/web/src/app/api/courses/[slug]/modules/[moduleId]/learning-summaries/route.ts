import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import {
  normalizeLearningSummaryOrganizationId,
  resolveLearningSummaryModuleAccess,
} from '@/features/courses/services/module-learning-summary-access.server'
import {
  ModuleLearningSummaryLimitError,
  ModuleLearningSummaryService,
  type ModuleLearningSummaryGenerationType,
} from '@/features/courses/services/module-learning-summary.service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; moduleId: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug, moduleId } = await params
    const organizationId = normalizeLearningSummaryOrganizationId(
      request.nextUrl.searchParams.get('orgId'),
    )
    const access = await resolveLearningSummaryModuleAccess({
      moduleId,
      organizationId,
      slug,
      userId: currentUser.id,
    })

    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const summaries = await ModuleLearningSummaryService.listSummariesWithClient(
      createAdminClient(),
      currentUser.id,
      access.courseId,
      moduleId,
    )

    return withCacheHeaders(
      NextResponse.json({ summaries }),
      cacheHeaders.private,
    )
  } catch (error) {
    logger.error('Error al obtener apuntes de aprendizaje del modulo:', error)

    return NextResponse.json(
      { error: 'Error interno al obtener apuntes del modulo' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; moduleId: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug, moduleId } = await params
    const body = (await request.json().catch(() => ({}))) as {
      generationType?: ModuleLearningSummaryGenerationType
      organizationId?: string | null
    }
    const organizationId = normalizeLearningSummaryOrganizationId(
      body.organizationId || request.nextUrl.searchParams.get('orgId'),
    )
    const access = await resolveLearningSummaryModuleAccess({
      moduleId,
      organizationId,
      slug,
      userId: currentUser.id,
    })

    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const generationType =
      body.generationType === 'manual_regeneration'
        ? 'manual_regeneration'
        : 'default'

    const summary = await ModuleLearningSummaryService.createSummary({
      courseId: access.courseId,
      generationType,
      moduleId,
      organizationId: access.organizationId,
      userId: currentUser.id,
    })

    return NextResponse.json(
      { summary },
      { status: summary?.status === 'generating' ? 202 : 201 },
    )
  } catch (error) {
    if (error instanceof ModuleLearningSummaryLimitError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    logger.error('Error al generar apunte de aprendizaje del modulo:', error)

    return NextResponse.json(
      { error: 'Error interno al generar apunte del modulo' },
      { status: 500 },
    )
  }
}
