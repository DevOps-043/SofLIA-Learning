import {
  buildRequiredQuizStatus,
  toRequiredQuizResources,
} from '@/features/courses/services/quiz/required-quiz-status.service'
import type { SidebarDataBundle, QuizStatusResponse } from './sidebar-results.types'
import type {
  SidebarContext,
  QuizSubmissionRow,
} from './sidebar.types'

const EMPTY_QUIZ_STATUS: QuizStatusResponse = {
  hasRequiredQuizzes: false,
  totalRequiredQuizzes: 0,
  completedQuizzes: 0,
  passedQuizzes: 0,
  allQuizzesPassed: true,
  quizzes: [],
}

async function fetchQuizSubmissions(
  context: SidebarContext,
  enrollmentId: string,
): Promise<QuizSubmissionRow[]> {
  const { data } = await context.supabase
    .from('user_quiz_submissions')
    .select('submission_id, material_id, activity_id, percentage_score, is_passed, completed_at, score, user_answers')
    .eq('user_id', context.currentUser.id)
    .eq('lesson_id', context.resolvedLessonId)
    .eq('enrollment_id', enrollmentId)
    .returns<QuizSubmissionRow[]>()

  return data || []
}

export async function buildQuizStatus(
  context: SidebarContext,
  data: SidebarDataBundle,
): Promise<QuizStatusResponse> {
  const totalRequiredQuizzes = data.materialQuizzes.length + data.activityQuizzes.length
  if (totalRequiredQuizzes === 0) return EMPTY_QUIZ_STATUS

  const submissions = await fetchQuizSubmissions(context, context.enrollment.enrollment_id)
  return buildRequiredQuizStatus({
    quizzes: toRequiredQuizResources({
      activityQuizzes: data.activityQuizzes.map((quiz) => ({
        activity_id: quiz.activity_id,
        activity_content: quiz.activity_content,
        activity_title: quiz.activity_title,
        is_required: quiz.is_required,
      })),
      materialQuizzes: data.materialQuizzes.map((quiz) => ({
        content_data: quiz.content_data,
        material_id: quiz.material_id,
        material_title: quiz.material_title,
      })),
    }),
    submissions,
  })
}
