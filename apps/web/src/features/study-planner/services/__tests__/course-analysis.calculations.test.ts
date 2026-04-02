import { describe, expect, it } from 'vitest'
import {
  buildCourseComplexity,
  buildLessonDurationFromEstimate,
  buildLessonDurationFromSources,
  createPostgrestInFilter,
} from '../course-analysis/calculations'

describe('course-analysis.calculations', () => {
  it('arma filtros PostgREST seguros para listas', () => {
    expect(createPostgrestInFilter(['course-1', 'course-2'])).toBe(
      '("course-1","course-2")',
    )
  })

  it('mapea estimaciones precalculadas a duración de lección', () => {
    expect(
      buildLessonDurationFromEstimate(
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Lección 1',
          duration_seconds: 120,
        },
        {
          lesson_id: 'lesson-1',
          video_minutes: 2,
          activities_time_minutes: 5,
          reading_time_minutes: 3,
          quiz_time_minutes: 4,
          exercise_time_minutes: 6,
          link_time_minutes: 2,
          interactions_time_minutes: 3,
          total_time_minutes: 25,
        },
      ),
    ).toMatchObject({
      lessonId: 'lesson-1',
      totalMinutes: 25,
      isEstimated: false,
    })
  })

  it('estima duración desde actividades y materiales faltantes', () => {
    const result = buildLessonDurationFromSources(
      {
        lesson_id: 'lesson-1',
        lesson_title: 'Lección 1',
        duration_seconds: 600,
      },
      [{ lesson_id: 'lesson-1', estimated_time_minutes: null }],
      [
        { lesson_id: 'lesson-1', estimated_time_minutes: null, material_type: 'quiz' },
        { lesson_id: 'lesson-1', estimated_time_minutes: 7, material_type: 'reading' },
      ],
    )

    expect(result.videoMinutes).toBe(10)
    expect(result.activitiesMinutes).toBe(5)
    expect(result.materialsMinutes).toBe(17)
    expect(result.isEstimated).toBe(true)
  })

  it('calcula complejidad y tiempos recomendados', () => {
    expect(
      buildCourseComplexity({
        courseId: 'course-1',
        level: 'advanced',
        category: 'IA',
        totalLessons: 60,
        totalModules: 8,
        totalDurationMinutes: 900,
        averageLessonDuration: 35,
      }),
    ).toMatchObject({
      complexityScore: 9,
      recommendedSessionMinutes: 25,
      recommendedBreakMinutes: 15,
    })
  })
})
