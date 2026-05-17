import type { ActivitySubmissionRequest } from '../../types/activity-config'
import {
  getActivitySubmissionRequirementIssues,
  summarizeActivitySubmissionRequirementIssues,
} from '../activity-submission-requirements.service'

import { CourseActivityError } from './error'
import { buildSubmissionUpsertPayload } from './payload'
import { persistActivitySubmissionPayload } from './persistence'
import { recalculateLessonActivityProgress } from './progress-recalculate'
import { getActivitySubmissionDetail } from './detail'
import type {
  CourseActivityContext,
  SupabaseServerClient,
} from './types'

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
  const submissionRequirementIssues =
    request.status === 'submitted'
      ? getActivitySubmissionRequirementIssues(context.resolvedActivityConfig, {
          responsePayload: submissionPayload.response_payload,
          responseText: submissionPayload.response_text,
          evidencePayload: submissionPayload.evidence_payload,
        })
      : []

  if (submissionRequirementIssues.length > 0) {
    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      400,
      summarizeActivitySubmissionRequirementIssues(submissionRequirementIssues),
      {
        issues: submissionRequirementIssues.map((issue) => issue.code),
      },
    )
  }

  const { data: submission, error } = await persistActivitySubmissionPayload(
    supabase,
    submissionPayload,
  )

  if (error || !submission) {
    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      500,
      'No fue posible guardar la actividad',
      { message: error?.message },
    )
  }

  await recalculateLessonActivityProgress(supabase, context)

  return getActivitySubmissionDetail(supabase, context)
}
