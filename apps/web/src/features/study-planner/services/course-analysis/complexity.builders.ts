import type {
  CourseComplexity,
  CourseLevel,
} from '../../types/user-context.types'

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
