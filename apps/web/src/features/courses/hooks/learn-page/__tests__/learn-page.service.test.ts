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
          total_duration_minutes: 17,
        },
      ],
    },
  ]

  it('builds the learn-data query without leaking empty params', () => {
    expect(
      buildLearnDataQuery({
        lessonId: 'lesson-2',
        language: 'es',
        organizationId: 'org-1',
      }),
    ).toBe('?lessonId=lesson-2&language=es&orgId=org-1')
    expect(buildLearnDataQuery({ language: 'en' })).toBe('?language=en')
  })

  it('calculates progress and resolves the right current lesson', () => {
    expect(calculateCourseProgress(modules)).toBe(50)
    expect(resolveCurrentLesson(modules, 'lesson-2')?.lesson_id).toBe('lesson-2')
    expect(resolveCurrentLesson(modules)?.lesson_id).toBe('lesson-2')
  })

  it('does not resume on an already-completed lesson even if reported as lastWatchedLessonId', () => {
    // lesson-1 is is_completed: true in the shared fixture above.
    expect(resolveCurrentLesson(modules, 'lesson-1')?.lesson_id).toBe('lesson-2')
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
      transcriptContent: 'Texto transcrito',
      summaryContent: 'Resumen corto',
      activeTab: 'activities',
      currentPage: '/courses/ia-aplicada/learn',
      currentActivities: [
        {
          activity_id: 'activity-1',
          activity_title: 'Ejercicio guiado',
          activity_description: 'Aplicar el concepto al equipo',
          activity_type: 'exercise',
          is_required: true,
          is_completed: false,
        },
      ],
      currentMaterials: [
        {
          material_id: 'material-1',
          material_title: 'Plantilla de apoyo',
          material_description: 'Documento para resolver la actividad',
          material_type: 'document',
          is_required: true,
        },
      ],
      quizStatus: {
        hasRequiredQuizzes: true,
        totalRequiredQuizzes: 1,
        completedQuizzes: 0,
        passedQuizzes: 0,
        allQuizzesPassed: false,
        quizzes: [
          {
            id: 'quiz-1',
            title: 'Quiz final',
            type: 'material',
            isCompleted: false,
            isPassed: false,
            percentage: 0,
          },
        ],
      },
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
    expect(courseContext?.currentTab).toBe('activities')
    expect(courseContext?.transcriptContent).toBe('Texto transcrito')
    expect(courseContext?.totalDurationMinutes).toBe(17)
    expect(courseContext?.learningProgressContext?.timeInCurrentLesson).toBe(
      '17 minutos',
    )
    expect(courseContext?.activitiesContext?.totalActivities).toBe(1)
    expect(courseContext?.materialsContext?.totalMaterials).toBe(1)
    expect(courseContext?.quizContext?.hasRequiredQuizzes).toBe(true)
    expect(workshopContext?.contextType).toBe('workshop')
    expect(workshopContext?.lessonId).toBe('lesson-2')
    expect(workshopContext?.lessonTitle).toBe('Practica guiada')
    expect(workshopContext?.moduleTitle).toBe('Fundamentos')
  })
})
