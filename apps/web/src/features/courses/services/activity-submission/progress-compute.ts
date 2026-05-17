import { resolveActivityConfigFromRecord } from '../activity-content-compatibility.service'

import { buildActivitySubmissionSummaryMap } from './summary-map'
import type {
  ActivityLikeRecord,
  CourseLessonContext,
  SupabaseServerClient,
} from './types'

export type LessonActivityProgressSummary = {
  activityProgressPercentage: number
  lastActivitySubmissionAt: string | null
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
}

function getLatestSubmissionTimestamp(
  submissions: Array<{ submitted_at: string | null; updated_at: string | null }>,
) {
  return submissions.reduce<string | null>((latest, submission) => {
    const candidate = submission.submitted_at || submission.updated_at
    if (!candidate) return latest
    if (!latest) return candidate
    return candidate > latest ? candidate : latest
  }, null)
}

export async function computeLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
): Promise<LessonActivityProgressSummary> {
  const { data: activities } = await supabase
    .from('lesson_activities')
    .select(
      'activity_id, activity_type, is_required, activity_config, requires_soflia_validation, external_tool_key, activity_content, ai_prompts',
    )
    .eq('lesson_id', context.lessonId)
    .order('activity_order_index', { ascending: true })

  const interactiveActivities = ((activities || []) as ActivityLikeRecord[]).filter(
    (activity) => Boolean(resolveActivityConfigFromRecord(activity)),
  )
  const requiredActivities = interactiveActivities.filter((activity) =>
    Boolean(activity.is_required),
  )

  if (interactiveActivities.length === 0) {
    return {
      activityProgressPercentage: 100,
      lastActivitySubmissionAt: null,
      requiredActivitiesCompleted: 0,
      requiredActivitiesTotal: 0,
    }
  }

  const summaryMap = await buildActivitySubmissionSummaryMap(
    supabase,
    context,
    interactiveActivities,
  )
  const requiredActivitiesCompleted = requiredActivities.filter((activity) => {
    return summaryMap.get(activity.activity_id)?.completionSatisfied === true
  }).length

  const { data: submissions } = await supabase
    .from('user_activity_submissions')
    .select('submitted_at, updated_at')
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)

  const requiredActivitiesTotal = requiredActivities.length
  const activityProgressPercentage =
    requiredActivitiesTotal === 0
      ? 100
      : Math.round(
          (requiredActivitiesCompleted / requiredActivitiesTotal) * 100 * 100,
        ) / 100

  return {
    activityProgressPercentage,
    lastActivitySubmissionAt: getLatestSubmissionTimestamp(submissions || []),
    requiredActivitiesCompleted,
    requiredActivitiesTotal,
  }
}
