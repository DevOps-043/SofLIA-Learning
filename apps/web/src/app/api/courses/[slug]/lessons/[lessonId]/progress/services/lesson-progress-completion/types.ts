import { createClient } from '@/lib/supabase/server'

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface CourseRow {
  id: string
  title: string
  instructor_id: string | null
}

export interface ModuleRow {
  module_id: string
  module_order_index: number
}

export interface LessonRow {
  lesson_id: string
  lesson_title: string | null
  lesson_order_index: number
  module_id: string
  module_order_index: number
}

export interface ProgressSummaryRow {
  lesson_id: string
  video_progress_percentage: number | null
  quiz_passed: boolean | null
}

export interface QuizSubmissionRow {
  is_passed: boolean | null
}

export interface LessonCompletionContext {
  supabase: SupabaseServerClient
  userId: string
  courseId: string
  enrollmentId: string
  courseTitle: string
  lessonId: string
  lessonTitle?: string | null
  instructorId?: string | null
  wasCompleted: boolean
  now: string
}

export type LessonProgressSideEffectHandler = (
  completionContext: LessonCompletionContext,
  overallProgress: number,
) => void
