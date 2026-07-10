import type {
  LessonActivityContextItem,
  LessonMaterialContextItem,
  LessonQuizContextItem,
} from './course-context.types'

export interface CourseLessonActivitiesContext {
  totalActivities: number
  requiredActivities: number
  completedActivities: number
  pendingRequiredCount: number
  pendingRequiredTitles?: string
  activityTypes?: LessonActivityContextItem[]
  currentActivityFocus?: {
    id?: string
    title: string
    type: string
    isRequired: boolean
    isCompleted?: boolean
    description: string
    prompts?: string[]
  } | null
}

export interface CourseLessonMaterialsContext {
  totalMaterials: number
  requiredMaterials: number
  materialTypes?: LessonMaterialContextItem[]
}

export interface CourseLessonQuizContext {
  hasRequiredQuizzes: boolean
  totalRequiredQuizzes: number
  completedQuizzes: number
  passedQuizzes: number
  allQuizzesPassed: boolean
  quizzes?: LessonQuizContextItem[]
}

export interface CourseLessonLearningProgressContext {
  currentLessonNumber: number
  totalLessons: number
  progressPercentage: number
  currentTab: string
  timeInCurrentLesson: string
}
