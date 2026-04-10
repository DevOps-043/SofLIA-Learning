import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import {
  activityValidationRequestSchema,
} from '@/features/courses/types/activity-config'
import {
  CourseActivityError,
  getActivitySubmissionDetail,
  recalculateLessonActivityProgress,
  resolveCourseActivityContext,
  saveActivitySubmission,
} from '@/features/courses/services/activity-submission.server.service'
import { evaluateActivitySubmissionWithSoflia } from '@/features/courses/services/activity-validation.server.service'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  slug: string
  lessonId: string
  activityId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsedRequest = activityValidationRequestSchema.safeParse(body)
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: 'Payload invalido para validar la actividad',
          details: parsedRequest.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { slug, lessonId, activityId } = await params
    const supabase = await createClient()
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
    )

    const currentSubmission = await getActivitySubmissionDetail(supabase, context)
    const shouldPersistIncomingPayload =
      parsedRequest.data.responseText !== undefined ||
      parsedRequest.data.responsePayload !== undefined ||
      parsedRequest.data.evidencePayload !== undefined

    const submission =
      shouldPersistIncomingPayload || !currentSubmission
        ? await saveActivitySubmission(supabase, context, {
            status: 'submitted',
            responseText:
              parsedRequest.data.responseText ?? currentSubmission?.responseText,
            responsePayload:
              parsedRequest.data.responsePayload ??
              currentSubmission?.responsePayload ??
              {},
            evidencePayload:
              parsedRequest.data.evidencePayload ??
              currentSubmission?.evidencePayload ??
              null,
          })
        : currentSubmission

    if (!submission) {
      throw new CourseActivityError(
        'SUBMISSION_NOT_FOUND',
        404,
        'No existe una respuesta para validar',
      )
    }

    const { feedback, modelName } = await evaluateActivitySubmissionWithSoflia({
      context,
      submission: {
        evidencePayload: submission.evidencePayload,
        responsePayload: submission.responsePayload,
        responseText: submission.responseText,
      },
    })

    const now = new Date().toISOString()
    const submissionStatus =
      feedback.resultStatus === 'pass'
        ? 'validated'
        : feedback.resultStatus === 'revise'
          ? 'needs_revision'
          : 'submitted'

    const { data: evaluation, error: evaluationError } = await supabase
      .from('user_activity_evaluations')
      .insert({
        feedback_payload: feedback,
        model_name: modelName,
        result_status: feedback.resultStatus,
        rubric_snapshot: context.resolvedActivityConfig?.validation.rubric ?? [],
        submission_id: submission.submissionId,
      })
      .select('evaluation_id')
      .single()

    if (evaluationError || !evaluation) {
      throw new CourseActivityError(
        'VALIDATION_FAILED',
        500,
        'No fue posible guardar la evaluacion de SofLIA',
        {
          message: evaluationError?.message,
        },
      )
    }

    const { error: submissionUpdateError } = await supabase
      .from('user_activity_submissions')
      .update({
        last_validated_at: now,
        status: submissionStatus,
        submitted_at: submission.submittedAt || now,
        updated_at: now,
      })
      .eq('submission_id', submission.submissionId)

    if (submissionUpdateError) {
      throw new CourseActivityError(
        'VALIDATION_FAILED',
        500,
        'No fue posible actualizar el estado de la actividad',
        {
          message: submissionUpdateError.message,
        },
      )
    }

    await recalculateLessonActivityProgress(supabase, context)
    const refreshedSubmission = await getActivitySubmissionDetail(supabase, context)

    return NextResponse.json({
      evaluation: feedback,
      submission: refreshedSubmission,
    })
  } catch (error) {
    const status =
      error instanceof CourseActivityError ? error.status : 500

    return NextResponse.json(
      {
        code: error instanceof CourseActivityError ? error.code : undefined,
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
        details:
          error instanceof CourseActivityError ? error.details : undefined,
      },
      { status },
    )
  }
}
