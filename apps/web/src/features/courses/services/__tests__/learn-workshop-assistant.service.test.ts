import { describe, expect, it } from 'vitest'
import type { DifficultyAnalysis } from '../../../../lib/rrweb/difficulty-pattern-detector'
import {
  buildWorkshopEnrichedLessonContext,
  buildWorkshopHelpMessage,
} from '../learn-workshop-assistant.service'

describe('learn-workshop-assistant.service', () => {
  const analysis: DifficultyAnalysis = {
    overallScore: 0.92,
    shouldIntervene: true,
    interventionMessage: 'Necesitas apoyo',
    detectedAt: Date.now(),
    patterns: [
      {
        type: 'failed_attempts',
        severity: 'high',
        description: 'Muchos intentos fallidos',
        timestamp: Date.now(),
      },
    ],
  }

  it('creates a user-facing help message from the strongest pattern', () => {
    expect(buildWorkshopHelpMessage(analysis)).toContain(
      'He intentado completar la actividad',
    )
  })

  it('enriches the lesson context with activity and progress details', () => {
    const context = buildWorkshopEnrichedLessonContext({
      lessonContext: {
        contextType: 'workshop',
        courseId: 'course-1',
        courseTitle: 'IA aplicada',
        lessonId: 'lesson-2',
        lessonTitle: 'Practica guiada',
      },
      analysis,
      behaviorAnalysis: 'El usuario duda al responder',
      currentActivities: [
        {
          activity_id: 'activity-1',
          activity_title: 'Quiz inicial',
          activity_type: 'quiz',
          is_required: true,
          is_completed: false,
        },
        {
          activity_id: 'activity-2',
          activity_title: 'Reflexion final',
          activity_type: 'reflection',
          is_required: false,
          is_completed: true,
        },
      ],
      activeTab: 'activities',
      currentLesson: {
        lesson_id: 'lesson-2',
        lesson_title: 'Practica guiada',
        duration_seconds: 900,
      },
      modules: [
        {
          module_id: 'module-1',
          module_title: 'Fundamentos',
          module_order_index: 1,
          lessons: [
            { lesson_id: 'lesson-1', lesson_title: 'Intro' },
            { lesson_id: 'lesson-2', lesson_title: 'Practica guiada' },
          ],
        },
      ],
      userJobTitle: 'Analista',
    })

    expect(context?.userRole).toBe('Analista')
    expect(context?.activitiesContext?.pendingRequiredCount).toBe(1)
    expect(context?.activitiesContext?.currentActivityFocus?.title).toBe(
      'Quiz inicial',
    )
    expect(context?.learningProgressContext?.progressPercentage).toBe(100)
    expect(context?.difficultyDetected?.suggestedHelpType).toBe('activity_hints')
    expect(context?.userBehaviorContext).toContain('duda')
  })
})
