// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useActivitiesData } from '../useActivitiesData'
import { clearDeduplicationCache } from '@/lib/supabase/request-deduplication'

vi.mock('../../../../../core/stores/organizationStore', () => ({
  useCurrentOrganizationId: () => null,
}))

vi.mock('../../../../../lib/course-content', () => ({
  normalizeContentForRenderer: vi.fn((value: unknown) =>
    typeof value === 'string' ? value : '',
  ),
  normalizeLessonActivityRecord: vi.fn((value: unknown) => value),
  normalizeLessonMaterialRecord: vi.fn((value: unknown) => value),
}))

function createJsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('useActivitiesData', () => {
  const activitiesPayload = [
    {
      activity_id: 'activity-1',
      activity_title: 'Quiz final',
      activity_type: 'quiz',
      activity_content: null,
      activity_order_index: 1,
      ai_prompts: null,
      is_required: true,
    },
  ]

  const materialsPayload: unknown[] = []

  const quizStatusPayload = {
    hasRequiredQuizzes: true,
    totalRequiredQuizzes: 1,
    completedQuizzes: 1,
    passedQuizzes: 0,
    allQuizzesPassed: false,
    quizzes: [
      {
        completedAt: '2026-04-11T10:00:00.000Z',
        id: 'activity-1',
        isCompleted: true,
        isPassed: false,
        latestSubmission: {
          completedAt: '2026-04-11T10:00:00.000Z',
          score: 0,
          submissionId: 'submission-1',
          userAnswers: {
            'question-1': 1,
          },
        },
        percentage: 0,
        title: 'Quiz final',
        type: 'activity',
      },
    ],
  }

  const pendingRefreshResolvers: Array<(response: Response) => void> = []
  let isRefreshPhase = false

  beforeEach(() => {
    isRefreshPhase = false

    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (requestUrl.endsWith('/feedback')) {
        return Promise.resolve(
          createJsonResponse({
            feedback_type: null,
          }),
        )
      }

      if (!isRefreshPhase) {
        if (requestUrl.includes('/sidebar-data')) {
          return Promise.resolve(
            createJsonResponse({
              activities: activitiesPayload,
              materials: materialsPayload,
              quizStatus: quizStatusPayload,
            }),
          )
        }

        return Promise.resolve(createJsonResponse({}))
      }

      return new Promise<Response>((resolve) => {
        pendingRefreshResolvers.push(resolve)
      })
    }) as typeof fetch
  })

  afterEach(() => {
    pendingRefreshResolvers.length = 0
    clearDeduplicationCache()
    vi.restoreAllMocks()
  })

  it('keeps the current quiz content mounted while refreshing after submit', async () => {
    const { result } = renderHook(() =>
      useActivitiesData({
        lessonId: 'lesson-1',
        selectedLang: 'es',
        slug: 'course-slug',
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activities).toHaveLength(1)

    let refreshPromise: Promise<void> | undefined

    act(() => {
      isRefreshPhase = true
      refreshPromise = result.current.refreshLessonContent()
    })

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.activities).toHaveLength(1)

    act(() => {
      pendingRefreshResolvers[0]?.(
        createJsonResponse({
          activities: activitiesPayload,
          materials: materialsPayload,
          quizStatus: quizStatusPayload,
        }),
      )
    })

    await act(async () => {
      await refreshPromise
    })

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })

    expect(result.current.quizStatus?.quizzes[0]?.isCompleted).toBe(true)
  })
})
