import type {
  CourseComplexity,
  CourseLevel,
  LessonDuration,
} from '../../types/user-context.types'
import {
  DEFAULT_ACTIVITY_TIME_MINUTES,
  DEFAULT_MATERIAL_TIME_MINUTES,
  INTERACTIONS_TIME_MINUTES,
} from './constants'
import type {
  LessonActivityRow,
  LessonEstimateRow,
  LessonMaterialRow,
  LessonRow,
} from './types'

export function createPostgrestInFilter(values: string[]): string {
  const escapedValues = values.map((value) => `"${value.replaceAll('"', '\\"')}"`)
  return `(${escapedValues.join(',')})`
}

export function getMaterialFallbackMinutes(materialType?: string | null): number {
  switch (materialType) {
    case 'quiz':
      return 10
    case 'exercise':
      return 15
    case 'reading':
      return 10
    default:
      return DEFAULT_MATERIAL_TIME_MINUTES
  }
}

export function buildLessonDurationFromEstimate(
  lesson: LessonRow,
  estimate: LessonEstimateRow,
): LessonDuration {
  return {
    lessonId: lesson.lesson_id,
    lessonTitle: lesson.lesson_title,
    videoMinutes: estimate.video_minutes || 0,
    activitiesMinutes: estimate.activities_time_minutes || 0,
    materialsMinutes:
      (estimate.reading_time_minutes || 0) +
      (estimate.quiz_time_minutes || 0) +
      (estimate.exercise_time_minutes || 0) +
      (estimate.link_time_minutes || 0),
    interactionsMinutes:
      estimate.interactions_time_minutes || INTERACTIONS_TIME_MINUTES,
    totalMinutes: estimate.total_time_minutes || 0,
    isEstimated: false,
  }
}

export function buildLessonDurationFromSources(
  lesson: LessonRow,
  activities: LessonActivityRow[],
  materials: LessonMaterialRow[],
): LessonDuration {
  let activitiesMinutes = 0
  let materialsMinutes = 0
  let hasEstimatedValues = false

  for (const activity of activities) {
    if (activity.estimated_time_minutes) {
      activitiesMinutes += activity.estimated_time_minutes
      continue
    }

    activitiesMinutes += DEFAULT_ACTIVITY_TIME_MINUTES
    hasEstimatedValues = true
  }

  for (const material of materials) {
    if (material.estimated_time_minutes) {
      materialsMinutes += material.estimated_time_minutes
      continue
    }

    materialsMinutes += getMaterialFallbackMinutes(material.material_type)
    hasEstimatedValues = true
  }

  const videoMinutes = Math.ceil((lesson.duration_seconds || 0) / 60)
  const totalMinutes =
    videoMinutes + activitiesMinutes + materialsMinutes + INTERACTIONS_TIME_MINUTES

  return {
    lessonId: lesson.lesson_id,
    lessonTitle: lesson.lesson_title,
    videoMinutes,
    activitiesMinutes,
    materialsMinutes,
    interactionsMinutes: INTERACTIONS_TIME_MINUTES,
    totalMinutes,
    isEstimated: hasEstimatedValues,
  }
}

export function calculateCourseComplexityScore(
  level: CourseLevel,
  averageLessonDuration: number,
  totalLessons: number,
): number {
  let complexityScore = 5

  switch (level) {
    case 'beginner':
      complexityScore -= 2
      break
    case 'advanced':
      complexityScore += 2
      break
    default:
      break
  }

  if (averageLessonDuration > 30) complexityScore += 1
  if (averageLessonDuration > 45) complexityScore += 1
  if (averageLessonDuration < 15) complexityScore -= 1

  if (totalLessons > 50) complexityScore += 1
  if (totalLessons > 100) complexityScore += 1
  if (totalLessons < 10) complexityScore -= 1

  return Math.max(1, Math.min(10, complexityScore))
}

export function getRecommendedSessionMinutes(complexityScore: number): {
  recommendedSessionMinutes: number
  recommendedBreakMinutes: number
} {
  if (complexityScore <= 3) {
    return {
      recommendedSessionMinutes: 45,
      recommendedBreakMinutes: 10,
    }
  }

  if (complexityScore <= 6) {
    return {
      recommendedSessionMinutes: 35,
      recommendedBreakMinutes: 10,
    }
  }

  return {
    recommendedSessionMinutes: 25,
    recommendedBreakMinutes: 15,
  }
}

export function buildCourseComplexity(params: {
  courseId: string
  level: CourseLevel
  category: string
  totalLessons: number
  totalModules: number
  totalDurationMinutes: number
  averageLessonDuration: number
}): CourseComplexity {
  const complexityScore = calculateCourseComplexityScore(
    params.level,
    params.averageLessonDuration,
    params.totalLessons,
  )
  const sessionConfig = getRecommendedSessionMinutes(complexityScore)

  return {
    courseId: params.courseId,
    level: params.level,
    category: params.category,
    totalLessons: params.totalLessons,
    totalModules: params.totalModules,
    totalDurationMinutes: params.totalDurationMinutes,
    averageLessonDuration: params.averageLessonDuration,
    complexityScore,
    ...sessionConfig,
  }
}
