import { buildQuizSubmissionSnapshot } from '@/features/courses/services/quiz-submission.service'
import type { SidebarDataBundle, QuizStatusResponse } from './sidebar-results.types'
import type {
  LessonActivityRow,
  LessonMaterialRow,
  QuizSubmissionRow,
  QuizStatusItem,
  SidebarContext,
} from './sidebar.types'

const EMPTY_QUIZ_STATUS: QuizStatusResponse = {
  hasRequiredQuizzes: false,
  totalRequiredQuizzes: 0,
  completedQuizzes: 0,
  passedQuizzes: 0,
  allQuizzesPassed: true,
  quizzes: [],
}

function buildMaterialQuizStatus(
  quiz: LessonMaterialRow,
  submissions: QuizSubmissionRow[],
): QuizStatusItem {
  const submission = submissions.find((item) => item.material_id === quiz.material_id)

  return {
    id: quiz.material_id,
    title: quiz.material_title,
    type: 'material',
    isCompleted: !!submission,
    isPassed: submission?.is_passed || false,
    latestSubmission: buildQuizSubmissionSnapshot({
      completedAt: submission?.completed_at,
      score: submission?.score,
      submissionId: submission?.submission_id,
      userAnswers: submission?.user_answers,
    }),
    percentage: submission?.percentage_score || 0,
    completedAt: submission?.completed_at || null,
  }
}

function buildActivityQuizStatus(
  quiz: LessonActivityRow,
  submissions: QuizSubmissionRow[],
): QuizStatusItem {
  const submission = submissions.find((item) => item.activity_id === quiz.activity_id)

  return {
    id: quiz.activity_id,
    title: quiz.activity_title,
    type: 'activity',
    isRequired: quiz.is_required,
    isCompleted: !!submission,
    isPassed: submission?.is_passed || false,
    latestSubmission: buildQuizSubmissionSnapshot({
      completedAt: submission?.completed_at,
      score: submission?.score,
      submissionId: submission?.submission_id,
      userAnswers: submission?.user_answers,
    }),
    percentage: submission?.percentage_score || 0,
    completedAt: submission?.completed_at || null,
  }
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
  const quizzes = [
    ...data.materialQuizzes.map((quiz) => buildMaterialQuizStatus(quiz, submissions)),
    ...data.activityQuizzes.map((quiz) => buildActivityQuizStatus(quiz, submissions)),
  ]
  const completedQuizzes = quizzes.filter((quiz) => quiz.isCompleted).length
  const passedQuizzes = quizzes.filter((quiz) => quiz.isPassed).length

  return {
    hasRequiredQuizzes: true,
    totalRequiredQuizzes,
    completedQuizzes,
    passedQuizzes,
    allQuizzesPassed: quizzes.every((quiz) => quiz.isPassed),
    quizzes,
  }
}
