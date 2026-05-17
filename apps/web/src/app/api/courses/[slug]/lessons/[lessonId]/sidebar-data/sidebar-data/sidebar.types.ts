import type { NextRequest } from 'next/server'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { SessionService } from '@/features/auth/services/session.service'
import type { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import type { resolveCourseLessonByLanguage } from '@/app/api/courses/_services/lesson-language-resolution.service'
import type { LearnLanguage } from '@/app/api/courses/_services/lesson-language-resolution.service'
import type { buildQuizSubmissionSnapshot } from '@/features/courses/services/quiz-submission.service'

export type SidebarSupabaseClient = ReturnType<typeof createAdminClient>
export type SidebarCurrentUser = Awaited<ReturnType<typeof SessionService.getCurrentUser>>
export type SidebarEnrollment = Awaited<ReturnType<typeof resolveCourseEnrollment>>
export type ResolvedCourseLesson = Awaited<ReturnType<typeof resolveCourseLessonByLanguage>>

export interface SidebarRouteContext {
  params: Promise<{ slug: string; lessonId: string }>
}

export interface CourseRow {
  id: string
  title: string | null
  instructor_id: string | null
}

export interface SidebarContext {
  request: NextRequest
  supabase: SidebarSupabaseClient
  currentUser: SidebarCurrentUser
  course: CourseRow
  organizationId: string | null
  language: LearnLanguage
  resolvedLesson: ResolvedCourseLesson
  resolvedLessonId: string
}

export interface LessonActivityRow {
  activity_id: string
  activity_title: string | null
  activity_description: string | null
  activity_type: string | null
  is_required?: boolean | null
  [key: string]: unknown
}

export interface LessonMaterialRow {
  material_id: string
  material_title: string | null
  material_description: string | null
  material_type: string | null
  [key: string]: unknown
}

export interface LiaCompletionRow {
  activity_id: string
  status: string
}

export interface QuizProgressRow {
  activity_id: string | null
  is_passed: boolean | null
}

export interface QuizSubmissionRow {
  submission_id: string
  material_id: string | null
  activity_id: string | null
  percentage_score: number | null
  is_passed: boolean | null
  completed_at: string | null
  score: number | null
  user_answers: unknown
}

export interface QuizStatusItem {
  id: string
  title: string | null
  type: 'material' | 'activity'
  isRequired?: boolean | null
  isCompleted: boolean
  isPassed: boolean
  latestSubmission: ReturnType<typeof buildQuizSubmissionSnapshot>
  percentage: number
  completedAt: string | null
}
