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
