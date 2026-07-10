export interface LessonActivityContextItem {
  id?: string
  title: string
  type: string
  description?: string
  isRequired?: boolean
  isCompleted?: boolean
}

export interface LessonMaterialContextItem {
  title: string
  type: string
  description?: string
  isRequired?: boolean
}

export interface LessonQuizContextItem {
  id: string
  title: string
  type: string
  isCompleted: boolean
  isPassed: boolean
  percentage: number
}

export interface CurrentLessonContext {
  contextType?: 'course' | 'workshop'
  courseId?: string
  courseSlug?: string
  courseTitle?: string
  courseDescription?: string
  enrollmentId?: string
  userRole?: string
  moduleId?: string
  moduleTitle?: string
  lessonId?: string
  lessonTitle?: string
  transcript?: string | null
  summary?: string | null
  description?: string | null
  durationSeconds?: number
  totalDurationMinutes?: number
  currentPage?: string
  currentTab?: string
  learningProgress?: {
    currentLessonNumber: number
    totalLessons: number
    progressPercentage: number
    currentTab: string
    timeInCurrentLesson: string
  }
  activities?: {
    totalActivities: number
    requiredActivities: number
    completedActivities: number
    pendingRequiredCount: number
    pendingRequiredTitles?: string
    items?: LessonActivityContextItem[]
    currentActivityFocus?: (LessonActivityContextItem & { prompts?: string[] }) | null
  }
  materials?: {
    totalMaterials: number
    requiredMaterials: number
    items?: LessonMaterialContextItem[]
  }
  quiz?: {
    hasRequiredQuizzes: boolean
    totalRequiredQuizzes: number
    completedQuizzes: number
    passedQuizzes: number
    allQuizzesPassed: boolean
    quizzes?: LessonQuizContextItem[]
  }
  userBehaviorContext?: string
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
}
