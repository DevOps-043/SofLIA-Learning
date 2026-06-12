import { NextRequest, NextResponse } from 'next/server'

import {
  courseDialogueMessageSchema,
  type CourseDialogueMessageBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseActivityContext } from '@/features/courses/services/activity-submission.server.service'
import { DialogueRuntimeError } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.errors'
import { processDialogueMessage } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  activityId: string
  lessonId: string
  slug: string
}

async function handlePost(
  _request: NextRequest,
  body: CourseDialogueMessageBody,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const { activityId, lessonId, slug } = await params
    const supabase = await createClient()
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
      body.organizationId ?? null,
    )

    const adminClient = createAdminClient()
    const result = await processDialogueMessage({
      client: adminClient,
      clientTurnId: body.clientTurnId,
      context,
      message: body.message,
      sessionId: body.sessionId,
    })

    return NextResponse.json(result)
  } catch (error) {
    const isRuntimeError = error instanceof DialogueRuntimeError
    const status = isRuntimeError ? error.status : 500

    return apiError(
      isRuntimeError ? error.code : 'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Error interno del servidor.',
      status,
      { details: isRuntimeError ? error.details : undefined },
    )
  }
}

export const POST = withZodBody(courseDialogueMessageSchema, handlePost)
