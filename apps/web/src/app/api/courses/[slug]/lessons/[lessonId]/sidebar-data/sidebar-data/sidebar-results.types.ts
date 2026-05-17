import type {
  LessonActivityRow,
  LessonMaterialRow,
  LiaCompletionRow,
  QuizProgressRow,
  QuizStatusItem,
  SidebarEnrollment,
} from './sidebar.types'

export interface QuizStatusResponse {
  hasRequiredQuizzes: boolean
  totalRequiredQuizzes: number
  completedQuizzes: number
  passedQuizzes: number
  allQuizzesPassed: boolean
  quizzes: QuizStatusItem[]
}

export interface SidebarDataBundle {
  rawActivities: LessonActivityRow[]
  materials: LessonMaterialRow[]
  materialQuizzes: LessonMaterialRow[]
  activityQuizzes: LessonActivityRow[]
  enrollment: SidebarEnrollment
  liaCompletions: LiaCompletionRow[]
  quizProgress: QuizProgressRow[]
}
