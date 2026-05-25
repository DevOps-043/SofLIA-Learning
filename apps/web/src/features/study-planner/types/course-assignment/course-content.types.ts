import type { CourseLevel } from '../user-profile.types'

export interface CourseInfo {
  id: string
  title: string
  description?: string
  slug: string
  category: string
  level: CourseLevel
  instructorId?: string
  instructorName?: string
  thumbnailUrl?: string
  durationTotalMinutes: number
  isActive: boolean
  price?: number
  averageRating?: number
  studentCount?: number
}

export interface CourseModule {
  moduleId: string
  moduleTitle: string
  moduleDescription?: string
  moduleOrderIndex: number
  moduleDurationMinutes: number
  isRequired: boolean
  isPublished: boolean
  lessons: LessonInfo[]
}

export interface LessonInfo {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonOrderIndex: number
  durationSeconds: number
  moduleId: string
  isPublished: boolean
}

export interface LessonDuration {
  lessonId: string
  lessonTitle: string
  videoMinutes: number
  activitiesMinutes: number
  materialsMinutes: number
  interactionsMinutes: number
  totalMinutes: number
  isEstimated: boolean
}

export interface CourseComplexity {
  courseId: string
  level: CourseLevel
  category: string
  totalLessons: number
  totalModules: number
  totalDurationMinutes: number
  averageLessonDuration: number
  complexityScore: number
  recommendedSessionMinutes: number
  recommendedBreakMinutes: number
}
