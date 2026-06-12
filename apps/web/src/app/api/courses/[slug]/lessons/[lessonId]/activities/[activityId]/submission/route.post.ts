import { NextRequest, NextResponse } from 'next/server'

import {
  courseActivitySubmissionSchema,
  type CourseActivitySubmissionBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { notifyCourseActivityCompletedBestEffort } from '@/features/courses/services/activity-notifications.server.service'
import {
  CourseActivityError,
  getActivitySubmissionDetail,
  resolveCourseActivityContext,
  saveActivitySubmission,
} from '@/features/courses/services/activity-submission.server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = {
  slug: string
  lessonId: string
  activityId: string
}

function sanitizeActivitySubmissionBody(
  body: CourseActivitySubmissionBody,
): CourseActivitySubmissionBody {
  if (body.responseText === undefined || body.responseText === null) {
    return body
  }

  return {
    ...body,
    responseText: sanitizeHtml(body.responseText, {
      level: 'rich',
      maxLength: 20_000,
    }),
  }
}

async function handlePost(
  _request: NextRequest,
  body: CourseActivitySubmissionBody,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const { slug, lessonId, activityId } = await params
    const supabase = createAdminClient()
    const organizationId = body.organizationId ?? null
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
      organizationId,
    )
    const previousSubmission = await getActivitySubmissionDetail(supabase, context)
    const submission = await saveActivitySubmission(
      supabase,
      context,
      sanitizeActivitySubmissionBody(body),
    )

    await notifyCourseActivityCompletedBestEffort({
      context,
      courseSlug: slug,
      nextSubmission: submission,
      previousSubmission,
    })

    return NextResponse.json({
      submission,
    })
  } catch (error) {
    const isCourseActivityError = error instanceof CourseActivityError
    const status = isCourseActivityError ? error.status : 500

    return apiError(
      isCourseActivityError ? error.code : 'INTERNAL_ERROR',
      isCourseActivityError ? error.message : 'Error interno del servidor.',
      status,
      { details: isCourseActivityError ? error.details : undefined },
    )
  }
}

export const POST = withZodBody(courseActivitySubmissionSchema, handlePost)
