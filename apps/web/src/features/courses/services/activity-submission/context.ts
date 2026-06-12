import {
  createOrganizationAiContextRepository,
  resolveStrictOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
import type { SupabaseOrganizationAiContextClient } from '@/lib/lia-context/services/organization-ai-context.types'

import { resolveActivityConfigFromRecord } from '../activity-content-compatibility.service'
import {
  ensureLessonBelongsToCourse,
  resolveCourseBySlug,
  resolveEnrollment,
} from './context-queries'
import { CourseActivityError } from './error'
import type {
  ActivityLikeRecord,
  CourseActivityContext,
  CourseLessonContext,
  SupabaseServerClient,
} from './types'

export async function resolveCourseLessonContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  organizationId?: string | null,
): Promise<CourseLessonContext> {
  const course = await resolveCourseBySlug(supabase, slug)
  await ensureLessonBelongsToCourse(supabase, course.id, lessonId)
  const enrollment = await resolveEnrollment(
    supabase,
    userId,
    course.id,
    organizationId,
  )

  return {
    courseId: course.id,
    courseTitle: course.title,
    enrollmentId: enrollment.enrollment_id,
    instructorId: course.instructor_id,
    lessonId,
    organizationId: enrollment.organization_id,
    userId,
  }
}

export async function resolveCourseActivityContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  activityId: string,
  organizationId?: string | null,
): Promise<CourseActivityContext> {
  const lessonContext = await resolveCourseLessonContext(
    supabase,
    userId,
    slug,
    lessonId,
    organizationId,
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
    throw new CourseActivityError('ACTIVITY_NOT_FOUND', 404, 'Actividad no encontrada')
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
    organizationAiContext: await resolveStrictOrganizationAiContext({
      organizationId: lessonContext.organizationId,
      repository: createOrganizationAiContextRepository(
        supabase as unknown as SupabaseOrganizationAiContextClient,
      ),
      userId,
    }),
    resolvedActivityConfig,
  }
}
