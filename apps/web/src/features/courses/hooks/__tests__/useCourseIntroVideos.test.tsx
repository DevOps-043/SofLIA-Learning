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
    window.localStorage.clear()
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

  it('shows configured intro videos once per browser even when server progress is already watched', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse(
          introVideosResponse({
            videos: [],
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

    await waitFor(() => expect(result.current.showVideoIntro).toBe(true))
    expect(result.current.introVideos).toEqual(['https://cdn.test/course-intro.mp4'])

    act(() => {
      result.current.handleVideoIntroComplete()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(
      window.localStorage.getItem(
        `soflia:intro-video-watched:v1:${ORG_ID}:curso-demo:https://cdn.test/course-intro.mp4`,
      ),
    ).toBe('true')
  })

  it('skips intro videos already watched in the current browser', async () => {
    window.localStorage.setItem(
      `soflia:intro-video-watched:v1:${ORG_ID}:curso-demo:https://cdn.test/course-intro.mp4`,
      'true',
    )

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        introVideosResponse({
          videos: ['https://cdn.test/course-intro.mp4'],
          allVideos: ['https://cdn.test/course-intro.mp4'],
          hasCourseVideo: true,
          courseIntroWatched: false,
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

    expect(result.current.showVideoIntro).toBe(false)
    expect(result.current.introVideos).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
