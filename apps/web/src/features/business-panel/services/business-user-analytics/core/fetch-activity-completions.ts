import { ActivityCompletionRecord } from './activity-completion-record'
import { AnalyticsScope } from './analytics-scope'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { getActivityCompletionCourseId } from './get-activity-completion-course-id'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'
import { unwrapRelation } from './unwrap-relation'

export async function fetchActivityCompletions(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
  organizationId: string,
  scope: AnalyticsScope,
) {
  const { data, error } = await supabase
    .from('lia_activity_completions')
    .select(`
      completion_id,
      activity_id,
      organization_id,
      status,
      completed_steps,
      total_steps,
      time_to_complete_seconds,
      attempts_to_complete,
      completed_at,
      started_at,
      updated_at,
      lesson_activities (
        activity_id,
        lesson_id,
        course_lessons (
          lesson_id,
          course_modules (
            course_id
          )
        )
      )
    `)
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<ActivityCompletionRecord[]>()

  logQueryError('business user SofLIA activity completions', error)

  return (data || []).filter((completion) => {
    const activityCourseId = getActivityCompletionCourseId(completion)
    const activityLessonId = unwrapRelation(completion.lesson_activities)?.lesson_id
    return (
      completion.organization_id === organizationId ||
      (activityCourseId ? scope.courseIds.has(activityCourseId) : false) ||
      (activityLessonId ? scope.lessonIds.has(activityLessonId) : false)
    )
  })
}
