import { describe, it, expect } from 'vitest'
import {
  getOrderedLessons,
  findOrderedLessonIndex,
  findOrderedLessonById,
  getPreviousOrderedLesson,
  getNextOrderedLesson,
  canCompleteOrderedLesson,
} from '../lessonNavigation.utils'
import type { LearnModule } from '../../components/learn/types'

const makeLesson = (id: string, order: number, isCompleted = false) => ({
  lesson_id: id,
  lesson_title: `Lesson ${id}`,
  lesson_order_index: order,
  is_completed: isCompleted,
})

const makeModule = (id: string, order: number, lessons: ReturnType<typeof makeLesson>[]): LearnModule => ({
  module_id: id,
  module_title: `Module ${id}`,
  module_order_index: order,
  lessons,
})

describe('getOrderedLessons', () => {
  it('returns empty array for empty modules', () => {
    expect(getOrderedLessons([])).toEqual([])
  })

  it('returns empty array for module with no lessons', () => {
    const modules = [makeModule('m1', 0, [])]
    expect(getOrderedLessons(modules)).toEqual([])
  })

  it('orders lessons by module_order_index then lesson_order_index', () => {
    const modules = [
      makeModule('m2', 1, [makeLesson('l3', 0), makeLesson('l4', 1)]),
      makeModule('m1', 0, [makeLesson('l1', 0), makeLesson('l2', 1)]),
    ]
    const result = getOrderedLessons(modules)
    expect(result.map((r) => r.lesson.lesson_id)).toEqual(['l1', 'l2', 'l3', 'l4'])
  })

  it('attaches the correct module to each lesson', () => {
    const modules = [makeModule('m1', 0, [makeLesson('l1', 0)])]
    const result = getOrderedLessons(modules)
    expect(result[0].module.module_id).toBe('m1')
  })

  it('does not mutate the original modules array', () => {
    const lessons = [makeLesson('l1', 1), makeLesson('l2', 0)]
    const modules = [makeModule('m1', 0, lessons)]
    const originalOrder = [...lessons]
    getOrderedLessons(modules)
    expect(modules[0].lessons).toEqual(originalOrder)
  })
})

describe('findOrderedLessonIndex', () => {
  const modules = [makeModule('m1', 0, [makeLesson('l1', 0), makeLesson('l2', 1)])]
  const ordered = getOrderedLessons(modules)

  it('returns the correct index for a known lesson', () => {
    expect(findOrderedLessonIndex(ordered, 'l2')).toBe(1)
  })

  it('returns -1 for an unknown lesson', () => {
    expect(findOrderedLessonIndex(ordered, 'unknown')).toBe(-1)
  })

  it('returns -1 when lessonId is null', () => {
    expect(findOrderedLessonIndex(ordered, null)).toBe(-1)
  })

  it('returns -1 when lessonId is undefined', () => {
    expect(findOrderedLessonIndex(ordered, undefined)).toBe(-1)
  })
})

describe('findOrderedLessonById', () => {
  const modules = [makeModule('m1', 0, [makeLesson('l1', 0)])]
  const ordered = getOrderedLessons(modules)

  it('returns the matching ordered lesson', () => {
    const result = findOrderedLessonById(ordered, 'l1')
    expect(result?.lesson.lesson_id).toBe('l1')
  })

  it('returns null for unknown id', () => {
    expect(findOrderedLessonById(ordered, 'nope')).toBeNull()
  })

  it('returns null when lessonId is null', () => {
    expect(findOrderedLessonById(ordered, null)).toBeNull()
  })
})

describe('getPreviousOrderedLesson', () => {
  const modules = [makeModule('m1', 0, [makeLesson('l1', 0), makeLesson('l2', 1), makeLesson('l3', 2)])]
  const ordered = getOrderedLessons(modules)

  it('returns the previous lesson', () => {
    expect(getPreviousOrderedLesson(ordered, 'l2')?.lesson_id).toBe('l1')
  })

  it('returns null for the first lesson', () => {
    expect(getPreviousOrderedLesson(ordered, 'l1')).toBeNull()
  })

  it('returns null for unknown lesson id', () => {
    expect(getPreviousOrderedLesson(ordered, 'unknown')).toBeNull()
  })
})

describe('getNextOrderedLesson', () => {
  const modules = [makeModule('m1', 0, [makeLesson('l1', 0), makeLesson('l2', 1), makeLesson('l3', 2)])]
  const ordered = getOrderedLessons(modules)

  it('returns the next lesson', () => {
    expect(getNextOrderedLesson(ordered, 'l1')?.lesson_id).toBe('l2')
  })

  it('returns null for the last lesson', () => {
    expect(getNextOrderedLesson(ordered, 'l3')).toBeNull()
  })

  it('returns null for unknown lesson id', () => {
    expect(getNextOrderedLesson(ordered, 'unknown')).toBeNull()
  })
})

describe('canCompleteOrderedLesson', () => {
  it('returns true for the first lesson regardless of completion', () => {
    const modules = [makeModule('m1', 0, [makeLesson('l1', 0), makeLesson('l2', 1)])]
    const ordered = getOrderedLessons(modules)
    expect(canCompleteOrderedLesson(ordered, 'l1')).toBe(true)
  })

  it('returns true when previous lesson is completed', () => {
    const modules = [makeModule('m1', 0, [makeLesson('l1', 0, true), makeLesson('l2', 1)])]
    const ordered = getOrderedLessons(modules)
    expect(canCompleteOrderedLesson(ordered, 'l2')).toBe(true)
  })

  it('returns false when previous lesson is not completed', () => {
    const modules = [makeModule('m1', 0, [makeLesson('l1', 0, false), makeLesson('l2', 1)])]
    const ordered = getOrderedLessons(modules)
    expect(canCompleteOrderedLesson(ordered, 'l2')).toBe(false)
  })

  it('returns false for unknown lesson id', () => {
    const modules = [makeModule('m1', 0, [makeLesson('l1', 0)])]
    const ordered = getOrderedLessons(modules)
    expect(canCompleteOrderedLesson(ordered, 'unknown')).toBe(false)
  })
})
