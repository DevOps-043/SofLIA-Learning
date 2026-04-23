import { resolveActivityConfigFromRecord } from '../activity-content-compatibility.service'
import type { ActivitySubmissionSummary } from '../../types/activity-config'
import { loadLatestEvaluationMap } from './activity-evaluation.server'
import { createActivitySubmissionSummary } from './activity-submission-summary.service'
import type {
  ActivityLikeRecord,
  ActivitySubmissionRow,
  CourseLessonContext,
  SupabaseServerClient,
} from './activity-submission.types'

export async function buildActivitySubmissionSummaryMap(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
  activities: ActivityLikeRecord[],
) {
  const interactiveActivities = activities.filter((activity) =>
    Boolean(resolveActivityConfigFromRecord(activity)),
  )
  const activityIds = interactiveActivities.map((activity) => activity.activity_id)

  if (activityIds.length === 0) {
    return new Map<string, ActivitySubmissionSummary>()
  }

  const { data: submissions } = await supabase
    .from('user_activity_submissions')
    .select(
      'submission_id, activity_id, status, response_text, response_payload, evidence_payload, submitted_at, last_validated_at, updated_at, created_at',
    )
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)
    .in('activity_id', activityIds)

  const submissionRows = (submissions || []) as ActivitySubmissionRow[]
  const evaluationMap = await loadLatestEvaluationMap(
    supabase,
    submissionRows.map((submission) => submission.submission_id),
  )
  const submissionByActivityId = new Map(
    submissionRows.map((submission) => [submission.activity_id, submission]),
  )
  const summaryMap = new Map<string, ActivitySubmissionSummary>()

  interactiveActivities.forEach((activity) => {
    const submission = submissionByActivityId.get(activity.activity_id)
    const resolvedConfig = resolveActivityConfigFromRecord(activity)

    if (!submission || !resolvedConfig) {
      return
    }

    summaryMap.set(
      activity.activity_id,
      createActivitySubmissionSummary(
        resolvedConfig,
        submission,
        evaluationMap.get(submission.submission_id) || null,
      ),
    )
  })

  return summaryMap
}
