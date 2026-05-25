import type {
  LessonActivityContextItem,
  LessonMaterialContextItem,
  LessonQuizContextItem,
  ModuleInfo,
} from './lia-course-items.types'

export interface CourseLessonContext {
  contextType?: 'course' | 'workshop'
  courseId?: string
  courseSlug?: string
  courseTitle?: string
  courseDescription?: string
  moduleId?: string
  moduleTitle?: string
  lessonId?: string
  lessonTitle?: string
  lessonDescription?: string
  transcriptContent?: string
  summaryContent?: string
  videoTime?: number
  durationSeconds?: number
  totalDurationMinutes?: number
  currentPage?: string
  currentTab?: string
  allModules?: ModuleInfo[]
  userRole?: string
  difficultyDetected?: {
    patterns: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
    }>
    overallScore: number
    shouldIntervene: boolean
    suggestedHelpType?: string
  }
  activitiesContext?: {
    totalActivities: number
    requiredActivities: number
    completedActivities: number
    pendingRequiredCount: number
    pendingRequiredTitles?: string
    activityTypes?: LessonActivityContextItem[]
    currentActivityFocus?: {
      title: string
      type: string
      isRequired: boolean
      isCompleted?: boolean
      description: string
      prompts?: string[]
    } | null
  }
  materialsContext?: {
    totalMaterials: number
    requiredMaterials: number
    materialTypes?: LessonMaterialContextItem[]
  }
  quizContext?: {
    hasRequiredQuizzes: boolean
    totalRequiredQuizzes: number
    completedQuizzes: number
    passedQuizzes: number
    allQuizzesPassed: boolean
    quizzes?: LessonQuizContextItem[]
  }
  userBehaviorContext?: string
  learningProgressContext?: {
    currentLessonNumber: number
    totalLessons: number
    progressPercentage: number
    currentTab: string
    timeInCurrentLesson: string
  }
}
