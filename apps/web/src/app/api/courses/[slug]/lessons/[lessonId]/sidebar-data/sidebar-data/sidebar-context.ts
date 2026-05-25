import { NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { resolveLearningPathAccessForCourse } from '@/features/learning-paths/services/learning-path-access.server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeLearnLanguage,
  resolveCourseLessonByLanguage,
} from '@/app/api/courses/_services/lesson-language-resolution.service'
import {
  courseNotFoundResponse,
  learningPathLockedResponse,
  lessonNotFoundResponse,
} from './sidebar-responses'
import type { CourseRow, SidebarContext } from './sidebar.types'

export async function resolveSidebarContext(
  request: SidebarContext['request'],
  params: Promise<{ slug: string; lessonId: string }>,
): Promise<SidebarContext | NextResponse> {
  const { slug, lessonId } = await params
  const supabase = createAdminClient()
  const organizationId = request.nextUrl.searchParams.get('orgId')?.trim() || null
  const language = normalizeLearnLanguage(request.nextUrl.searchParams.get('language'))
  const currentUser = await SessionService.getCurrentUser()
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('slug', slug)
    .returns<CourseRow>()
    .single()

  if (courseError || !course) return courseNotFoundResponse()

  if (currentUser?.id) {
    const learningPathState = await resolveLearningPathAccessForCourse({
      userId: currentUser.id,
      courseId: course.id,
      organizationId,
    })

    if (learningPathState && !learningPathState.currentCourseUnlocked) {
      return learningPathLockedResponse(learningPathState)
    }
  }

  const resolvedLesson = await resolveCourseLessonByLanguage({
    supabase,
    courseId: course.id,
    lessonId,
    requestedLanguage: language,
  })

  if (!resolvedLesson.lesson || !resolvedLesson.baseLessonId) {
    return lessonNotFoundResponse()
  }

  return {
    request,
    supabase,
    currentUser,
    course,
    organizationId,
    language,
    resolvedLesson,
    resolvedLessonId: resolvedLesson.baseLessonId,
  }
}
