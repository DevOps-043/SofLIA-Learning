import type { ActivitySubmissionRequest } from '../../types/activity-config'
import {
  getActivitySubmissionRequirementIssues,
  summarizeActivitySubmissionRequirementIssues,
} from '../activity-submission-requirements.service'
import { CourseActivityError } from './course-activity-error'
import { getActivitySubmissionDetail } from './activity-submission-detail.server'
import { recalculateLessonActivityProgress } from './lesson-progress-upsert.server'
import { toRecord } from './activity-submission-payload.utils'
import type {
  CourseActivityContext,
  SupabaseServerClient,
} from './activity-submission.types'

function buildSubmissionUpsertPayload(
  context: CourseActivityContext,
  request: ActivitySubmissionRequest,
  now: string,
) {
  const responsePayload = toRecord(request.responsePayload)
  const evidencePayload = request.evidencePayload
    ? toRecord(request.evidencePayload)
    : null

  return {
    activity_id: context.activity.activity_id,
    course_id: context.courseId,
    enrollment_id: context.enrollmentId,
    evidence_payload: evidencePayload,
    last_validated_at: null,
    lesson_id: context.lessonId,
    organization_id: context.organizationId,
    response_payload: responsePayload,
    response_text: request.responseText?.trim() || null,
    status: request.status,
    submitted_at: request.status === 'submitted' ? now : null,
    updated_at: now,
    user_id: context.userId,
  }
}

export async function saveActivitySubmission(
  supabase: SupabaseServerClient,
  context: CourseActivityContext,
  request: ActivitySubmissionRequest,
) {
  if (!context.resolvedActivityConfig) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_INTERACTIVE',
      400,
      'La actividad no tiene un contrato interactivo disponible',
    )
  }

  const now = new Date().toISOString()
  const submissionPayload = buildSubmissionUpsertPayload(context, request, now)
  const issues = request.status === 'submitted'
    ? getActivitySubmissionRequirementIssues(context.resolvedActivityConfig, {
        responsePayload: submissionPayload.response_payload,
        responseText: submissionPayload.response_text,
        evidencePayload: submissionPayload.evidence_payload,
      })
    : []

  if (issues.length > 0) {
    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      400,
      summarizeActivitySubmissionRequirementIssues(issues),
      { issues: issues.map((issue) => issue.code) },
    )
  }

  const { data: submission, error } = await supabase
    .from('user_activity_submissions')
    .upsert(submissionPayload, { onConflict: 'user_id,activity_id,enrollment_id' })
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .single()

  if (error || !submission) {
    throw new CourseActivityError('INVALID_SUBMISSION', 500, 'No fue posible guardar la actividad', {
      message: error?.message,
    })
  }

  await recalculateLessonActivityProgress(supabase, context)
  return getActivitySubmissionDetail(supabase, context)
}
