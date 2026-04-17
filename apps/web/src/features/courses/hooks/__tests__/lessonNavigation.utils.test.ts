import { describe, it, expect } from 'vitest'
import {
  getIncompleteActivities,
  getOrderedLessons,
  getPendingRequiredActivities,
  hasIncompleteActivities,
  isLessonVideoCompleted,
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

describe('activity completion helpers', () => {
  const activities = [
    {
      activity_id: 'a1',
      activity_title: 'Required pending',
      activity_type: 'ai_chat',
      is_required: true,
      is_completed: false,
    },
    {
      activity_id: 'a2',
      activity_title: 'Optional pending',
      activity_type: 'reflection',
      is_required: false,
      is_completed: false,
    },
    {
      activity_id: 'a3',
      activity_title: 'Completed',
      activity_type: 'exercise',
      is_required: true,
      is_completed: true,
    },
  ]

  it('returns every incomplete activity regardless of requirement', () => {
    expect(getIncompleteActivities(activities).map((activity) => activity.activity_id)).toEqual([
      'a1',
      'a2',
    ])
  })

  it('detects when any incomplete activity is still pending', () => {
    expect(hasIncompleteActivities(activities)).toBe(true)
    expect(hasIncompleteActivities([])).toBe(false)
  })

  it('keeps required-only filtering available for blocking flows', () => {
    expect(
      getPendingRequiredActivities(activities).map((activity) => activity.activity_id)
    ).toEqual(['a1'])
  })

  it('does not block navigation for read-only reflection activities', () => {
    expect(
      getPendingRequiredActivities([
        {
          activity_id: 'reflection-reading',
          activity_title: 'Lectura complementaria',
          activity_type: 'reflection',
          is_required: true,
          is_completed: false,
        },
      ]),
    ).toEqual([])
  })
})

describe('isLessonVideoCompleted', () => {
  it('returns true when a lesson has no video configured', () => {
    expect(isLessonVideoCompleted(makeLesson('l1', 0))).toBe(true)
  })

  it('returns false when the watched progress is below the threshold', () => {
    expect(
      isLessonVideoCompleted({
        ...makeLesson('l1', 0),
        progress_percentage: 94,
        video_provider: 'direct',
        video_provider_id: 'video.mp4',
      }),
    ).toBe(false)
  })

  it('returns true once the video reaches the completion threshold', () => {
    expect(
      isLessonVideoCompleted({
        ...makeLesson('l1', 0),
        progress_percentage: 95,
        video_provider: 'direct',
        video_provider_id: 'video.mp4',
      }),
    ).toBe(true)
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
