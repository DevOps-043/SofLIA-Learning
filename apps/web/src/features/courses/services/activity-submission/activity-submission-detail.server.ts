import type { ActivitySubmissionDetail } from '../../types/activity-config'
import { loadLatestEvaluationMap } from './activity-evaluation.server'
import { createActivitySubmissionSummary } from './activity-submission-summary.service'
import { toRecord } from './activity-submission-payload.utils'
import type {
  ActivitySubmissionRow,
  CourseActivityContext,
  SupabaseServerClient,
} from './activity-submission.types'

export async function getActivitySubmissionDetail(
  supabase: SupabaseServerClient,
  context: CourseActivityContext,
) {
  const { data: submission } = await supabase
    .from('user_activity_submissions')
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)
    .eq('activity_id', context.activity.activity_id)
    .maybeSingle()

  if (!submission || !context.resolvedActivityConfig) {
    return null
  }

  const activitySubmission = submission as ActivitySubmissionRow
  const evaluationMap = await loadLatestEvaluationMap(supabase, [
    activitySubmission.submission_id,
  ])
  const summary = createActivitySubmissionSummary(
    context.resolvedActivityConfig,
    activitySubmission,
    evaluationMap.get(activitySubmission.submission_id) || null,
  )

  return {
    ...summary,
    responseText: activitySubmission.response_text,
    responsePayload: toRecord(activitySubmission.response_payload),
    evidencePayload: activitySubmission.evidence_payload
      ? toRecord(activitySubmission.evidence_payload)
      : null,
  } satisfies ActivitySubmissionDetail
}
