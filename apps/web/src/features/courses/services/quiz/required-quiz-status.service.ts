import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'

import { buildQuizSubmissionSnapshot } from '../quiz-submission.service'
import { parseQuizSubmissionAnswers } from '../quiz-submission.service'
import { gradeQuiz, resolveGradableQuizQuestions } from './grade-quiz.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

export type RequiredQuizType = 'material' | 'activity'

export interface RequiredQuizResource {
  id: string
  rawContent?: unknown
  title: string | null
  type: RequiredQuizType
  isRequired?: boolean | null
}

export interface RequiredQuizSubmission {
  activity_id?: string | null
  completed_at?: string | null
  material_id?: string | null
  percentage_score?: number | null
  is_passed?: boolean | null
  score?: number | null
  submission_id?: string | null
  user_answers?: unknown
}

export interface RequiredQuizStatusItem {
  completedAt: string | null
  id: string
  title: string | null
  type: RequiredQuizType
  isRequired?: boolean | null
  isCompleted: boolean
  isPassed: boolean
  latestSubmission: ReturnType<typeof buildQuizSubmissionSnapshot>
  percentage: number
}

export interface RequiredQuizStatus {
  hasRequiredQuizzes: boolean
  totalRequiredQuizzes: number
  completedQuizzes: number
  passedQuizzes: number
  allQuizzesPassed: boolean
  quizzes: RequiredQuizStatusItem[]
}

export interface RequiredQuizMaterialRow {
  content_data?: unknown
  material_id: string
  material_title: string | null
}

export interface RequiredQuizActivityRow {
  activity_content?: unknown
  activity_id: string
  activity_title: string | null
  is_required?: boolean | null
}

const EMPTY_REQUIRED_QUIZ_STATUS: RequiredQuizStatus = {
  hasRequiredQuizzes: false,
  totalRequiredQuizzes: 0,
  completedQuizzes: 0,
  passedQuizzes: 0,
  allQuizzesPassed: true,
  quizzes: [],
}

export function toRequiredQuizResources(input: {
  activityQuizzes: RequiredQuizActivityRow[]
  materialQuizzes: RequiredQuizMaterialRow[]
}): RequiredQuizResource[] {
  return [
    ...input.materialQuizzes.map((quiz) => ({
      id: quiz.material_id,
      rawContent: quiz.content_data,
      title: quiz.material_title,
      type: 'material' as const,
    })),
    ...input.activityQuizzes.map((quiz) => ({
      id: quiz.activity_id,
      rawContent: quiz.activity_content,
      title: quiz.activity_title,
      type: 'activity' as const,
      isRequired: quiz.is_required,
    })),
  ]
}

function findSubmissionForQuiz(
  quiz: RequiredQuizResource,
  submissions: RequiredQuizSubmission[],
): RequiredQuizSubmission | undefined {
  return submissions.find((submission) =>
    quiz.type === 'material'
      ? submission.material_id === quiz.id
      : submission.activity_id === quiz.id,
  )
}

function resolvePersistedPointsEarned(
  quiz: RequiredQuizResource,
  submission: RequiredQuizSubmission | undefined,
) {
  if (!submission || quiz.rawContent === undefined) return undefined

  const questions = resolveGradableQuizQuestions(quiz.rawContent)
  if (questions.length === 0) return undefined

  return gradeQuiz(
    questions,
    parseQuizSubmissionAnswers(submission.user_answers),
  ).pointsEarned
}

export function buildRequiredQuizStatus(input: {
  quizzes: RequiredQuizResource[]
  submissions: RequiredQuizSubmission[]
}): RequiredQuizStatus {
  const totalRequiredQuizzes = input.quizzes.length
  if (totalRequiredQuizzes === 0) {
    return EMPTY_REQUIRED_QUIZ_STATUS
  }

  const quizzes = input.quizzes.map((quiz) => {
    const submission = findSubmissionForQuiz(quiz, input.submissions)

    return {
      id: quiz.id,
      title: quiz.title,
      type: quiz.type,
      isRequired: quiz.isRequired,
      isCompleted: Boolean(submission),
      isPassed: submission?.is_passed || false,
      latestSubmission: buildQuizSubmissionSnapshot({
        completedAt: submission?.completed_at,
        pointsEarned: resolvePersistedPointsEarned(quiz, submission),
        score: submission?.score,
        submissionId: submission?.submission_id,
        userAnswers: submission?.user_answers,
      }),
      percentage: submission?.percentage_score || 0,
      completedAt: submission?.completed_at || null,
    }
  })

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

export async function fetchRequiredLessonQuizStatus(
  supabase: SupabaseServerClient,
  input: {
    enrollmentId: string
    lessonId: string
    userId: string
  },
): Promise<RequiredQuizStatus> {
  const [materialQuizzesResult, activityQuizzesResult] = await Promise.all([
    supabase
      .from('lesson_materials')
      .select('material_id, material_title, content_data')
      .eq('lesson_id', input.lessonId)
      .eq('material_type', 'quiz')
      .returns<RequiredQuizMaterialRow[]>(),
    supabase
      .from('lesson_activities')
      .select('activity_id, activity_title, is_required, activity_content')
      .eq('lesson_id', input.lessonId)
      .eq('activity_type', 'quiz')
      .eq('is_required', true)
      .returns<RequiredQuizActivityRow[]>(),
  ])

  const quizzes = toRequiredQuizResources({
    activityQuizzes: activityQuizzesResult.data || [],
    materialQuizzes: materialQuizzesResult.data || [],
  })

  if (quizzes.length === 0) {
    return EMPTY_REQUIRED_QUIZ_STATUS
  }

  const { data: submissions } = await supabase
    .from('user_quiz_submissions')
    .select(
      'submission_id, material_id, activity_id, percentage_score, is_passed, completed_at, score, user_answers',
    )
    .eq('user_id', input.userId)
    .eq('lesson_id', input.lessonId)
    .eq('enrollment_id', input.enrollmentId)
    .returns<RequiredQuizSubmission[]>()

  return buildRequiredQuizStatus({
    quizzes,
    submissions: submissions || [],
  })
}
