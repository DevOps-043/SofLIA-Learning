import { describe, expect, it } from 'vitest'
import {
  buildLearnDataQuery,
  buildLearnLessonContext,
  buildWorkshopMetadataContext,
  calculateCourseProgress,
  resolveCurrentLesson,
} from '../learn-page.service'

describe('learn-page.service', () => {
  const modules = [
    {
      module_id: 'module-1',
      module_title: 'Fundamentos',
      module_order_index: 1,
      lessons: [
        {
          lesson_id: 'lesson-1',
          lesson_title: 'Introduccion',
          is_completed: true,
          lesson_order_index: 1,
        },
        {
          lesson_id: 'lesson-2',
          lesson_title: 'Practica guiada',
          is_completed: false,
          lesson_order_index: 2,
          duration_seconds: 900,
        },
      ],
    },
  ]

  it('builds the learn-data query without leaking empty params', () => {
    expect(
      buildLearnDataQuery({ lessonId: 'lesson-2', language: 'es' }),
    ).toBe('?lessonId=lesson-2&language=es')
    expect(buildLearnDataQuery({ language: 'en' })).toBe('?language=en')
  })

  it('calculates progress and resolves the right current lesson', () => {
    expect(calculateCourseProgress(modules)).toBe(50)
    expect(resolveCurrentLesson(modules, 'lesson-2')?.lesson_id).toBe('lesson-2')
    expect(resolveCurrentLesson(modules)?.lesson_id).toBe('lesson-2')
  })

  it('builds workshop metadata context with the full module map', () => {
    const context = buildWorkshopMetadataContext({
      metadata: {
        workshopId: 'course-1',
        workshopTitle: 'IA aplicada',
        workshopDescription: 'Curso base',
        modules: [
          {
            moduleId: 'module-1',
            moduleTitle: 'Fundamentos',
            moduleOrderIndex: 1,
            lessons: [
              {
                lessonId: 'lesson-1',
                lessonTitle: 'Introduccion',
                lessonOrderIndex: 1,
              },
            ],
          },
        ],
      },
      slug: 'ia-aplicada',
      userJobTitle: 'Analista',
    })

    expect(context.contextType).toBe('workshop')
    expect(context.courseSlug).toBe('ia-aplicada')
    expect(context.userRole).toBe('Analista')
    expect(context.allModules?.[0]?.moduleTitle).toBe('Fundamentos')
  })

  it('builds the lesson context for course and workshop flows', () => {
    const courseContext = buildLearnLessonContext({
      course: {
        id: 'course-1',
        title: 'IA aplicada',
        description: 'Curso base',
      },
      currentLesson: modules[0]!.lessons[1]!,
      modules,
      workshopMetadata: null,
      slug: 'ia-aplicada',
      userJobTitle: 'Analista',
    })

    const workshopContext = buildLearnLessonContext({
      course: {
        id: 'course-1',
        title: 'IA aplicada',
      },
      currentLesson: modules[0]!.lessons[1]!,
      modules,
      workshopMetadata: {
        contextType: 'workshop',
        courseId: 'course-1',
        courseTitle: 'IA aplicada',
      },
      slug: 'ia-aplicada',
      userJobTitle: 'Analista',
    })

    expect(courseContext?.contextType).toBe('course')
    expect(courseContext?.lessonId).toBe('lesson-2')
    expect(workshopContext?.contextType).toBe('workshop')
    expect(workshopContext?.lessonTitle).toBe('Practica guiada')
    expect(workshopContext?.moduleTitle).toBe('Fundamentos')
  })
})
