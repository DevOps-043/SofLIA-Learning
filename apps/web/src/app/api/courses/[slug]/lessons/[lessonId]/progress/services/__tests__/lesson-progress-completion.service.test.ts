import { describe, expect, it } from 'vitest'
import {
  hasPassedRequiredQuizzes,
  LessonProgressError,
  sortLessonsForCourse,
} from '../lesson-progress.shared'

describe('lesson-progress-completion.service', () => {
  it('sorts lessons by module order and lesson order', () => {
    const sortedLessons = sortLessonsForCourse([
      {
        lesson_id: 'lesson-3',
        lesson_title: 'Leccion 3',
        lesson_order_index: 2,
        module_id: 'module-2',
        module_order_index: 2,
      },
      {
        lesson_id: 'lesson-2',
        lesson_title: 'Leccion 2',
        lesson_order_index: 2,
        module_id: 'module-1',
        module_order_index: 1,
      },
      {
        lesson_id: 'lesson-1',
        lesson_title: 'Leccion 1',
        lesson_order_index: 1,
        module_id: 'module-1',
        module_order_index: 1,
      },
    ])

    expect(sortedLessons.map((lesson) => lesson.lesson_id)).toEqual([
      'lesson-1',
      'lesson-2',
      'lesson-3',
    ])
  })

  it('verifies when all required quizzes are passed', () => {
    expect(
      hasPassedRequiredQuizzes(2, [
        { is_passed: true },
        { is_passed: false },
        { is_passed: true },
      ]),
    ).toBe(true)

    expect(
      hasPassedRequiredQuizzes(2, [
        { is_passed: true },
        { is_passed: false },
      ]),
    ).toBe(false)
  })

  it('preserves status and details in lesson progress errors', () => {
    const error = new LessonProgressError(
      'REQUIRED_QUIZ_NOT_PASSED',
      400,
      'Hace falta realizar actividad',
      { passed: 1, totalRequired: 2 },
    )

    expect(error.code).toBe('REQUIRED_QUIZ_NOT_PASSED')
    expect(error.status).toBe(400)
    expect(error.details).toEqual({ passed: 1, totalRequired: 2 })
  })
})
