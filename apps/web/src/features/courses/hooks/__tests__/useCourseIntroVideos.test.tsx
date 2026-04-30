// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCourseIntroVideos } from '../useCourseIntroVideos'

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const localStorageEntries = new Map<string, string>()

function installLocalStorageMock() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return localStorageEntries.size
      },
      clear: () => localStorageEntries.clear(),
      getItem: (key: string) => localStorageEntries.get(key) ?? null,
      key: (index: number) => Array.from(localStorageEntries.keys())[index] ?? null,
      removeItem: (key: string) => {
        localStorageEntries.delete(key)
      },
      setItem: (key: string, value: string) => {
        localStorageEntries.set(key, value)
      },
    } satisfies Storage,
  })
}

function introVideosResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    videos: [],
    courseVideos: [],
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
    localStorageEntries.clear()
    fetchMock.mockReset()
    installLocalStorageMock()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    document.head.innerHTML = ''
    window.localStorage.clear()
  })

  it('replays configured intro videos before launching the course tour', async () => {
    window.localStorage.setItem(
      `soflia:intro-video-watched:v1:${ORG_ID}:curso-demo:https://cdn.test/course-intro.mp4`,
      'true',
    )

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        introVideosResponse({
          courseVideos: ['https://cdn.test/course-intro.mp4'],
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
    expect(result.current.showVideoIntro).toBe(false)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `/api/courses/curso-demo/intro-videos?orgId=${ORG_ID}`,
      { credentials: 'include' },
    )

    const launchTour = vi.fn()

    act(() => {
      result.current.restartWithIntroVideos(launchTour)
    })

    await waitFor(() => expect(result.current.isForceShow).toBe(true))

    expect(result.current.introVideos).toEqual(['https://cdn.test/course-intro.mp4'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
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
            courseVideos: ['https://cdn.test/course-intro.mp4'],
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

  it('only shows and marks the course intro video from the course panel', async () => {
    const learningPathId = '00000000-0000-0000-0000-000000000002'

    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse(
          introVideosResponse({
            courseVideos: ['https://cdn.test/course-intro.mp4'],
            allVideos: [
              'https://cdn.test/lp-intro.mp4',
              'https://cdn.test/course-intro.mp4',
            ],
            hasLpVideo: true,
            hasCourseVideo: true,
            lpIntroWatched: false,
            courseIntroWatched: false,
            learningPathId,
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
    expect(result.current.introVideos).toEqual(['https://cdn.test/course-intro.mp4'])

    act(() => {
      result.current.handleVideoIntroComplete()
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/courses/curso-demo/intro-videos/watched')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body as string)).toEqual({
      watchedCourse: true,
      watchedLp: false,
      organizationId: ORG_ID,
    })
  })

  it('starts the tour when replay intro video fetch times out', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(introVideosResponse()))
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result } = renderHook(() =>
      useCourseIntroVideos({
        courseSlug: 'curso-demo',
        organizationId: ORG_ID,
      }),
    )

    await waitFor(() => expect(result.current.isLoadingIntro).toBe(false))

    const launchTour = vi.fn()

    vi.useFakeTimers()
    try {
      act(() => {
        result.current.restartWithIntroVideos(launchTour)
      })

      await act(async () => {
        vi.advanceTimersByTime(1800)
        await Promise.resolve()
      })

      expect(launchTour).toHaveBeenCalledTimes(1)
      expect(result.current.showVideoIntro).toBe(false)
    } finally {
      vi.useRealTimers()
    }
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
          courseVideos: ['https://cdn.test/course-intro.mp4'],
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
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/courses/curso-demo/intro-videos/watched')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body as string)).toEqual({
      watchedCourse: true,
      watchedLp: false,
      organizationId: ORG_ID,
    })
  })
})
