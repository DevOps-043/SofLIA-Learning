export interface QuizQuestionLike {
  correctAnswer?: string | number
  correct_answer?: string | number
  explanation?: string
  id?: string
  options?: unknown
  points?: number | string
  question?: string
  questionText?: string
  questionType?: string
  type?: string
}

export interface QuizSourceData extends Record<string, unknown> {
  items?: QuizQuestionLike[]
  passing_score?: number | string
  questions?: QuizQuestionLike[]
}
