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

/**
 * Transcripción de una lección del curso distinta de la actual. Permite que
 * SofLIA responda sobre el vídeo de una lección anterior sin que el usuario
 * tenga que volver a ella.
 */
export interface CourseLessonTranscriptContext {
  lessonId?: string
  lessonTitle?: string
  moduleTitle?: string
  lessonOrder?: number
  summary?: string | null
  /** Transcripción con marcas de tiempo ya formateada para el prompt. */
  transcriptWithTimecodes?: string | null
  /** `false` cuando la lección aún no tiene segmentos y no se pueden citar tiempos. */
  hasTimecodes?: boolean
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
  /** Transcripción de ESTA lección con marcas `[mm:ss]`, si el vídeo fue procesado con segmentos. */
  transcriptWithTimecodes?: string | null
  hasTimecodes?: boolean
  /** Transcripciones del resto de lecciones del curso, para preguntas sobre vídeos anteriores. */
  courseLessons?: CourseLessonTranscriptContext[]
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
