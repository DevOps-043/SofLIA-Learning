import {
  computeLessonActivityProgress,
  type LessonActivityProgressSummary,
} from './progress-compute'
import type { CourseLessonContext, SupabaseServerClient } from './types'

function buildProgressUpdate(
  summary: LessonActivityProgressSummary,
  now: string,
) {
  return {
    activity_progress_percentage: summary.activityProgressPercentage,
    last_activity_submission_at: summary.lastActivitySubmissionAt,
    last_accessed_at: now,
    required_activities_completed: summary.requiredActivitiesCompleted,
    required_activities_total: summary.requiredActivitiesTotal,
    updated_at: now,
  }
}

export async function recalculateLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
) {
  const summary = await computeLessonActivityProgress(supabase, context)
  const now = new Date().toISOString()
  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('progress_id')
    .eq('enrollment_id', context.enrollmentId)
    .eq('lesson_id', context.lessonId)
    .maybeSingle()

  if (existingProgress?.progress_id) {
    await supabase
      .from('user_lesson_progress')
      .update(buildProgressUpdate(summary, now))
      .eq('progress_id', existingProgress.progress_id)

    return summary
  }

  await supabase.from('user_lesson_progress').insert({
    activity_progress_percentage: summary.activityProgressPercentage,
    enrollment_id: context.enrollmentId,
    last_activity_submission_at: summary.lastActivitySubmissionAt,
    last_accessed_at: now,
    lesson_id: context.lessonId,
    organization_id: context.organizationId,
    required_activities_completed: summary.requiredActivitiesCompleted,
    required_activities_total: summary.requiredActivitiesTotal,
    started_at: now,
    user_id: context.userId,
  })

  return summary
}
