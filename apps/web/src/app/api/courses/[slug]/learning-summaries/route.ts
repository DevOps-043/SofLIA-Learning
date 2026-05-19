import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import {
  normalizeLearningSummaryOrganizationId,
  parseLearningSummaryModuleIds,
  resolveLearningSummaryCourseAccess,
  verifyLearningSummaryModulesBelongToCourse,
} from '@/features/courses/services/module-learning-summary-access.server'
import { ModuleLearningSummaryService } from '@/features/courses/services/module-learning-summary.service'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug } = await params
    const organizationId = normalizeLearningSummaryOrganizationId(
      request.nextUrl.searchParams.get('orgId'),
    )
    const moduleIds = parseLearningSummaryModuleIds(
      request.nextUrl.searchParams.get('moduleIds'),
    )
    const access = await resolveLearningSummaryCourseAccess({
      organizationId,
      slug,
      userId: currentUser.id,
    })

    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const moduleAccess = await verifyLearningSummaryModulesBelongToCourse({
      courseId: access.courseId,
      moduleIds,
      supabase: access.supabase,
    })

    if (moduleAccess !== true) {
      return NextResponse.json(
        { error: moduleAccess.error },
        { status: moduleAccess.status },
      )
    }

    const summaries = await ModuleLearningSummaryService.listCourseSummariesWithClient(
      createAdminClient(),
      currentUser.id,
      access.courseId,
      moduleIds,
    )

    return withCacheHeaders(
      NextResponse.json({ summaries }),
      cacheHeaders.private,
    )
  } catch (error) {
    logger.error('Error al obtener apuntes de aprendizaje del curso:', error)

    return NextResponse.json(
      { error: 'Error interno al obtener apuntes del curso' },
      { status: 500 },
    )
  }
}
