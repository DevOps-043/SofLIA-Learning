import { resolveActivityConfigFromRecord } from '../activity-content-compatibility.service'
import { CourseActivityError } from './course-activity-error'
import { resolveCourseLessonContext } from './course-lesson-context.server'
import type {
  ActivityLikeRecord,
  CourseActivityContext,
  SupabaseServerClient,
} from './activity-submission.types'

export async function resolveCourseActivityContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  activityId: string,
): Promise<CourseActivityContext> {
  const lessonContext = await resolveCourseLessonContext(
    supabase,
    userId,
    slug,
    lessonId,
  )
  const { data: activity, error } = await supabase
    .from('lesson_activities')
    .select(
      'activity_id, activity_title, activity_description, activity_type, is_required, activity_config, requires_soflia_validation, external_tool_key, activity_content, ai_prompts',
    )
    .eq('lesson_id', lessonId)
    .eq('activity_id', activityId)
    .single()

  if (error || !activity) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_FOUND',
      404,
      'Actividad no encontrada',
    )
  }

  const resolvedActivityConfig = resolveActivityConfigFromRecord(
    activity as ActivityLikeRecord,
  )

  if (!resolvedActivityConfig) {
    throw new CourseActivityError(
      'ACTIVITY_NOT_INTERACTIVE',
      400,
      'La actividad usa un flujo especializado y no admite submissions directas',
    )
  }

  return {
    ...lessonContext,
    activity: activity as ActivityLikeRecord,
    resolvedActivityConfig,
  }
}
