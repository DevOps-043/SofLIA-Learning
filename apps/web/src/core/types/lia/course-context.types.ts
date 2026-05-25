import type {
  CourseLessonActivitiesContext,
  CourseLessonLearningProgressContext,
  CourseLessonMaterialsContext,
  CourseLessonQuizContext,
} from './lesson-context-sections.types'

export interface ModuleInfo {
  moduleId: string
  moduleTitle: string
  moduleDescription?: string
  moduleOrderIndex: number
  lessons: LessonInfo[]
}

export interface LessonInfo {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonOrderIndex: number
  durationSeconds?: number
  totalDurationMinutes?: number
}

export interface LessonActivityContextItem {
  title: string
  type: string
  description?: string
  isRequired: boolean
  isCompleted: boolean
}

export interface LessonMaterialContextItem {
  title: string
  type: string
  description?: string
  isRequired: boolean
}

export interface LessonQuizContextItem {
  id: string
  title: string
  type: string
  isCompleted: boolean
  isPassed: boolean
  percentage: number
}

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
  activitiesContext?: CourseLessonActivitiesContext
  materialsContext?: CourseLessonMaterialsContext
  quizContext?: CourseLessonQuizContext
  userBehaviorContext?: string
  learningProgressContext?: CourseLessonLearningProgressContext
}
