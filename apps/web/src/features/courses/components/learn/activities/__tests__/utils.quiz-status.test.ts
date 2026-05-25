import { describe, expect, it } from 'vitest'
import { findQuizStatusItem } from '../utils'
import type { LessonQuizStatus, LessonQuizStatusItem } from '../../types'

const makeQuizStatus = (
  quizzes: Array<{ id: string; type: 'activity' | 'material'; passed?: boolean }>,
): LessonQuizStatus => ({ quizzes }) as unknown as LessonQuizStatus

describe('findQuizStatusItem', () => {
  it('returns undefined for missing or empty quiz status', () => {
    expect(findQuizStatusItem(null, 'q1', 'activity')).toBeUndefined()
    expect(findQuizStatusItem(makeQuizStatus([]), 'q1', 'activity')).toBeUndefined()
  })

  it('finds an item matching id and type', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity', passed: true }])
    const result = findQuizStatusItem(status, 'q1', 'activity')

    expect(result).toBeDefined()
    expect((result as LessonQuizStatusItem).id).toBe('q1')
  })

  it('returns undefined when id or type do not match', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity' }])

    expect(findQuizStatusItem(status, 'q1', 'material')).toBeUndefined()
    expect(findQuizStatusItem(status, 'q99', 'activity')).toBeUndefined()
  })

  it('finds the correct item among multiple quizzes', () => {
    const status = makeQuizStatus([
      { id: 'q1', type: 'activity' },
      { id: 'q2', type: 'material' },
      { id: 'q3', type: 'activity' },
    ])

    expect((findQuizStatusItem(status, 'q3', 'activity') as LessonQuizStatusItem).id).toBe('q3')
  })
})
