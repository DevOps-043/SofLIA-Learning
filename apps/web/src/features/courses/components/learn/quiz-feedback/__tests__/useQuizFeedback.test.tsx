// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useQuizFeedback } from '../useQuizFeedback'

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      first_name: 'Lord',
      last_name: 'Tester',
    },
  }),
}))

vi.mock('@/core/stores/organizationStore', () => ({
  useOrganizationStore: () => ({
    id: 'org-1',
  }),
}))

describe('useQuizFeedback', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('reuses stored feedback for the same lesson and prompt after remount', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        feedback: {
          content: 'Retroalimentacion guardada',
          createdAt: '2026-05-16T10:00:00.000Z',
          updatedAt: '2026-05-16T10:00:00.000Z',
        },
        source: 'generated',
      }),
      ok: true,
    })) as unknown as typeof fetch

    global.fetch = fetchMock

    const firstRender = renderHook(() =>
      useQuizFeedback({ courseSlug: 'course-slug', lessonId: 'lesson-1' }),
    )

    await act(async () => {
      await firstRender.result.current.requestFeedback({
        prompt: 'prompt del quiz',
      })
    })

    await waitFor(() => {
      expect(firstRender.result.current.content).toBe(
        'Retroalimentacion guardada',
      )
    })

    firstRender.unmount()

    const secondRender = renderHook(() =>
      useQuizFeedback({ courseSlug: 'course-slug', lessonId: 'lesson-1' }),
    )

    await act(async () => {
      await secondRender.result.current.requestFeedback({
        prompt: 'prompt del quiz',
      })
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(secondRender.result.current.content).toBe(
      'Retroalimentacion guardada',
    )
  })
})
