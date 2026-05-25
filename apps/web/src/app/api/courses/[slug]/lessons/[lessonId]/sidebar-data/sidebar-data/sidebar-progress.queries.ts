import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import type {
  LiaCompletionRow,
  QuizProgressRow,
  SidebarContext,
} from './sidebar.types'

export function fetchEnrollment(context: SidebarContext) {
  return context.currentUser
    ? resolveCourseEnrollment(
        context.supabase,
        context.currentUser.id,
        context.course.id,
        context.organizationId,
      )
    : Promise.resolve(null)
}

export function fetchLiaCompletions(context: SidebarContext) {
  return context.currentUser
    ? context.supabase
        .from('lia_activity_completions')
        .select('activity_id, status')
        .eq('user_id', context.currentUser.id)
        .eq('status', 'completed')
        .returns<LiaCompletionRow[]>()
    : Promise.resolve({ data: null, error: null })
}

export function fetchQuizProgress(context: SidebarContext) {
  return context.currentUser
    ? context.supabase
        .from('user_quiz_submissions')
        .select('activity_id, is_passed')
        .eq('user_id', context.currentUser.id)
        .eq('lesson_id', context.resolvedLessonId)
        .returns<QuizProgressRow[]>()
    : Promise.resolve({ data: null, error: null })
}
