import type {
  LiaCompletionRow,
  QuizProgressRow,
  SidebarContext,
} from './sidebar.types'

export function fetchLiaCompletions(context: SidebarContext) {
  return context.supabase
    .from('lia_activity_completions')
    .select('activity_id, status')
    .eq('user_id', context.currentUser.id)
    .eq('status', 'completed')
    .returns<LiaCompletionRow[]>()
}

export function fetchQuizProgress(context: SidebarContext) {
  return context.supabase
    .from('user_quiz_submissions')
    .select('activity_id, is_passed')
    .eq('user_id', context.currentUser.id)
    .eq('lesson_id', context.resolvedLessonId)
    .returns<QuizProgressRow[]>()
}
