export interface ExistingQuizSubmissionRow {
  is_passed: boolean | null
  percentage_score: number | null
  submission_id: string
}

export interface QuizQuestionRow {
  correctAnswer?: string | number
  id?: string
  options?: string[]
  points?: number
  question_id?: string
  questionType?: string
}

export interface QuizSubmissionMatch {
  activity_id?: string
  enrollment_id: string
  lesson_id: string
  material_id?: string
  user_id: string
}

export interface QuizSubmitRequestBody {
  activityId?: string | null
  answers?: Record<string, string | number>
  materialId?: string | null
  organizationId?: string | null
  quizData?: QuizQuestionRow[] | { questions?: QuizQuestionRow[] }
  totalPoints?: number
}

export interface QuizGradeResult {
  calculatedTotalPoints: number
  correctAnswers: number
  isPassed: boolean
  percentageScore: number
  pointsEarned: number
  questions: QuizQuestionRow[]
  totalQuestions: number
}

/** Typed API route result. Use the generic parameter to express the success payload shape. */
export interface ApiRouteResult<TBody = Record<string, unknown>> {
  status: number
  body: TBody
}
