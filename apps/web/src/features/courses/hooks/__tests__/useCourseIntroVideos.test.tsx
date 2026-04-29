// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCourseIntroVideos } from '../useCourseIntroVideos'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

function introVideosResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    videos: [],
    allVideos: [],
    hasLpVideo: false,
    hasCourseVideo: false,
    lpIntroWatched: true,
    courseIntroWatched: true,
    learningPathId: null,
    ...overrides,
  }
}

function mockJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } as unknown as Response
}

describe('useCourseIntroVideos', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    document.head.innerHTML = ''
  })

  it('replays configured intro videos before launching the course tour', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse(
          introVideosResponse({
            allVideos: ['https://cdn.test/course-intro.mp4'],
            hasCourseVideo: true,
            courseIntroWatched: true,
          }),
        ),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(
          introVideosResponse({
            allVideos: ['https://cdn.test/course-intro.mp4'],
            hasCourseVideo: true,
            courseIntroWatched: true,
          }),
        ),
      )

    const { result } = renderHook(() =>
      useCourseIntroVideos({
        courseSlug: 'curso-demo',
        organizationId: ORG_ID,
      }),
    )

    await waitFor(() => expect(result.current.isLoadingIntro).toBe(false))

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `/api/courses/curso-demo/intro-videos?orgId=${ORG_ID}`,
      { credentials: 'include' },
    )

    const launchTour = vi.fn()

    act(() => {
      result.current.restartWithIntroVideos(launchTour)
    })

    await waitFor(() => expect(result.current.showVideoIntro).toBe(true))

    expect(result.current.introVideos).toEqual(['https://cdn.test/course-intro.mp4'])
    expect(result.current.isForceShow).toBe(true)
    expect(launchTour).not.toHaveBeenCalled()

    act(() => {
      result.current.handleVideoIntroComplete()
    })

    expect(launchTour).toHaveBeenCalledTimes(1)
  })

  it('marks first-time course intro playback with the current organization', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse(
          introVideosResponse({
            videos: ['https://cdn.test/course-intro.mp4'],
            allVideos: ['https://cdn.test/course-intro.mp4'],
            hasCourseVideo: true,
            courseIntroWatched: false,
          }),
        ),
      )
      .mockResolvedValueOnce(mockJsonResponse({ success: true }))

    const { result } = renderHook(() =>
      useCourseIntroVideos({
        courseSlug: 'curso-demo',
        organizationId: ORG_ID,
      }),
    )

    await waitFor(() => expect(result.current.showVideoIntro).toBe(true))

    act(() => {
      result.current.handleVideoIntroComplete()
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/courses/curso-demo/intro-videos/watched',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          watchedCourse: true,
          organizationId: ORG_ID,
        }),
      }),
    )
  })
})
