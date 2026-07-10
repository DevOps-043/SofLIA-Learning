import { NextRequest, NextResponse } from 'next/server'
import { enqueueLessonAutoNoteJob } from '@/features/notebook/services/notebook-generation.server.service'

import {
  courseActivityValidationSchema,
  type CourseActivityValidationBody,
} from '@/app/api/courses/_schemas'
import { SessionService } from '@/features/auth/services/session.service'
import { notifyCourseActivityCompletedBestEffort } from '@/features/courses/services/activity-notifications.server.service'
import {
  CourseActivityError,
  getActivitySubmissionDetail,
  recalculateLessonActivityProgress,
  resolveCourseActivityContext,
  saveActivitySubmission,
} from '@/features/courses/services/activity-submission.server.service'
import { evaluateActivitySubmissionWithSoflia } from '@/features/courses/services/activity-validation.server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = {
  slug: string
  lessonId: string
  activityId: string
}

function sanitizeActivityValidationBody(
  body: CourseActivityValidationBody,
): CourseActivityValidationBody {
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
  body: CourseActivityValidationBody,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const sanitizedBody = sanitizeActivityValidationBody(body)
    const { slug, lessonId, activityId } = await params
    const supabase = createAdminClient()
    const organizationId = sanitizedBody.organizationId ?? null
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
      organizationId,
    )

    const currentSubmission = await getActivitySubmissionDetail(supabase, context)
    const shouldPersistIncomingPayload =
      sanitizedBody.responseText !== undefined ||
      sanitizedBody.responsePayload !== undefined ||
      sanitizedBody.evidencePayload !== undefined

    const submission =
      shouldPersistIncomingPayload || !currentSubmission
        ? await saveActivitySubmission(supabase, context, {
            status: 'submitted',
            responseText:
              sanitizedBody.responseText ?? currentSubmission?.responseText,
            responsePayload:
              sanitizedBody.responsePayload ??
              currentSubmission?.responsePayload ??
              {},
            evidencePayload:
              sanitizedBody.evidencePayload ??
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
        rubric_snapshot:
          context.resolvedActivityConfig &&
          'validation' in context.resolvedActivityConfig
            ? context.resolvedActivityConfig.validation.rubric ?? []
            : [],
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

    if (context.organizationId) {
      const { data: completedProgress } = await supabase
        .from('user_lesson_progress')
        .select('progress_id')
        .eq('user_id', context.userId)
        .eq('enrollment_id', context.enrollmentId)
        .eq('lesson_id', context.lessonId)
        .eq('is_completed', true)
        .maybeSingle()
      if (completedProgress) {
        try {
          await enqueueLessonAutoNoteJob({
            courseId: context.courseId,
            enrollmentId: context.enrollmentId,
            lessonId: context.lessonId,
            organizationId: context.organizationId,
            priority: 40,
            sourceVersion: evaluation.evaluation_id,
            userId: context.userId,
          })
        } catch {
          // The evaluation is already durable; generation can be retried later.
        }
      }
    }

    await notifyCourseActivityCompletedBestEffort({
      context,
      courseSlug: slug,
      nextSubmission: refreshedSubmission,
      previousSubmission: currentSubmission,
    })

    return NextResponse.json({
      evaluation: feedback,
      submission: refreshedSubmission,
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

export const POST = withZodBody(courseActivityValidationSchema, handlePost, {
  emptyBodyFallback: {},
})
