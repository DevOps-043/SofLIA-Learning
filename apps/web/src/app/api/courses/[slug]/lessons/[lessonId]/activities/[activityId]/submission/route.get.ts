import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'

import {
  activitySubmissionRequestSchema,
} from '@/features/courses/types/activity-config'

import {
  CourseActivityError,
  getActivitySubmissionDetail,
  resolveCourseActivityContext,
  saveActivitySubmission,
} from '@/features/courses/services/activity-submission.server.service'

import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = {
  slug: string
  lessonId: string
  activityId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug, lessonId, activityId } = await params
    const organizationId = request.nextUrl.searchParams.get('orgId')
    const supabase = createAdminClient()
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
      organizationId,
    )
    const submission = await getActivitySubmissionDetail(supabase, context)

    return NextResponse.json({
      submission,
    })
  } catch (error) {
    const isCourseActivityError = error instanceof CourseActivityError
    const status = isCourseActivityError ? error.status : 500

    return NextResponse.json(
      {
        code: isCourseActivityError ? error.code : undefined,
        error: isCourseActivityError ? error.message : 'Error interno del servidor',
      },
      { status },
    )
  }
}
