import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLessonContentState } from '../useActivitiesData/useLessonContentState'
import { emptyLessonContentSnapshot, fetchLessonContentSnapshot } from '../../../../services/lesson-content.client'

vi.mock('../../../../services/lesson-content.client', () => ({
  emptyLessonContentSnapshot: { activities: [], materials: [], quizStatus: null },
  fetchLessonContentSnapshot: vi.fn(),
}))

const snapshot = (id: string) => ({
  ...emptyLessonContentSnapshot,
  activities: [{ activity_id: id, activity_title: id, activity_type: 'quiz' }],
})

describe('lesson content request lifecycle', () => {
  beforeEach(() => { vi.mocked(fetchLessonContentSnapshot).mockReset() })

  it('ignores an old lesson response arriving after the current lesson', async () => {
    let resolveOld!: (value: ReturnType<typeof snapshot>) => void
    vi.mocked(fetchLessonContentSnapshot)
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce(snapshot('quiz-b'))
    const { result, rerender } = renderHook(
      ({ lessonId }) => useLessonContentState({ lessonId, slug: 'course', selectedLang: 'es' }),
      { initialProps: { lessonId: 'a' } },
    )
    rerender({ lessonId: 'b' })
    await waitFor(() => expect(result.current.activities[0]?.activity_id).toBe('quiz-b'))
    await act(async () => resolveOld(snapshot('quiz-a')))
    expect(result.current.activities[0]?.activity_id).toBe('quiz-b')
  })

  it('clears the previous quiz while the next lesson is loading', async () => {
    vi.mocked(fetchLessonContentSnapshot).mockImplementation(() => new Promise(() => {}))
    const { result, rerender } = renderHook(
      ({ lessonId, initialContent }) => useLessonContentState({ lessonId, initialContent, slug: 'course', selectedLang: 'es' }),
      { initialProps: { lessonId: 'a', initialContent: snapshot('quiz-a') as ReturnType<typeof snapshot> | null } },
    )
    rerender({ lessonId: 'b', initialContent: null })
    expect(result.current.loading).toBe(true)
    expect(result.current.activities).toEqual([])
  })

  it('exposes a retryable error instead of reporting no activities', async () => {
    vi.mocked(fetchLessonContentSnapshot).mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce(snapshot('quiz-a'))
    const { result } = renderHook(() => useLessonContentState({ lessonId: 'a', slug: 'course', selectedLang: 'es' }))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    await act(async () => { await result.current.loadLessonContent({ forceRefresh: true }) })
    expect(result.current.error).toBeNull()
    expect(result.current.activities[0]?.activity_id).toBe('quiz-a')
  })

  it('keeps the newest refresh when requests complete out of order', async () => {
    let resolveOld!: (value: ReturnType<typeof snapshot>) => void
    vi.mocked(fetchLessonContentSnapshot)
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce(snapshot('new'))
    const { result } = renderHook(() => useLessonContentState({ lessonId: 'a', slug: 'course', selectedLang: 'es' }))
    await act(async () => { await result.current.loadLessonContent({ forceRefresh: true }) })
    await act(async () => resolveOld(snapshot('old')))
    expect(result.current.activities[0]?.activity_id).toBe('new')
  })
})
