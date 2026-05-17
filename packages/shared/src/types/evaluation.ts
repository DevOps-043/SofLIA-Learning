export interface Evaluation {
  id: string
  moduleId: string
  title: string
  description: string
  questions: EvaluationQuestion[]
  passingScore: number
  timeLimit?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EvaluationQuestion {
  id: string
  evaluationId: string
  type: 'multiple_choice' | 'text'
  question: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
  order: number
}

export interface EvaluationAttempt {
  id: string
  userId: string
  evaluationId: string
  answers: EvaluationAnswer[]
  score: number
  isPassed: boolean
  completedAt: Date
  createdAt: Date
}

export interface EvaluationAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
}
