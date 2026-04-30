'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { IntroVideosResponse } from '@/app/api/courses/[slug]/intro-videos/route'

interface UseCourseIntroVideosOptions {
  courseSlug: string
  organizationId?: string | null
  enabled?: boolean
}

interface UseCourseIntroVideosResult {
  introVideos: string[]
  showVideoIntro: boolean
  isForceShow: boolean
  isLoadingIntro: boolean
  handleVideoIntroComplete: () => void
  restartWithIntroVideos: (afterFn: () => void) => void
}

const INTRO_VIDEO_STORAGE_PREFIX = 'soflia:intro-video-watched:v1'
const INTRO_VIDEO_RESTART_TIMEOUT_MS = 1800

interface IntroVideosWatchedPayload {
  watchedCourse: boolean
  watchedLp: boolean
  learningPathId?: string
}

function buildIntroVideosUrl(slug: string, organizationId?: string | null) {
  const query = new URLSearchParams()
  if (organizationId) query.set('orgId', organizationId)

  const queryString = query.toString()
  return `/api/courses/${encodeURIComponent(slug)}/intro-videos${queryString ? `?${queryString}` : ''}`
}

function buildIntroVideoStorageKey(params: {
  courseSlug: string
  organizationId?: string | null
  videoUrl: string
}) {
  const organizationScope = params.organizationId ?? 'no-org'
  return `${INTRO_VIDEO_STORAGE_PREFIX}:${organizationScope}:${params.courseSlug}:${params.videoUrl}`
}

function hasWatchedIntroVideo(params: {
  courseSlug: string
  organizationId?: string | null
  videoUrl: string
}) {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(buildIntroVideoStorageKey(params)) === 'true'
  } catch {
    return false
  }
}

function markIntroVideosWatched(params: {
  courseSlug: string
  organizationId?: string | null
  videoUrls: string[]
}) {
  if (typeof window === 'undefined') return

  try {
    for (const videoUrl of params.videoUrls) {
      window.localStorage.setItem(
        buildIntroVideoStorageKey({
          courseSlug: params.courseSlug,
          organizationId: params.organizationId,
          videoUrl,
        }),
        'true',
      )
    }
  } catch {
    // Si el storage no estÃ¡ disponible, la sesiÃ³n actual sigue funcionando.
  }
}

function filterUnwatchedIntroVideos(params: {
  courseSlug: string
  organizationId?: string | null
  videoUrls: string[]
}) {
  return params.videoUrls.filter(
    (videoUrl) =>
      !hasWatchedIntroVideo({
        courseSlug: params.courseSlug,
        organizationId: params.organizationId,
        videoUrl,
      }),
  )
}

async function markIntroVideosWatchedOnServer(params: {
  courseSlug: string
  organizationId?: string | null
  payload: IntroVideosWatchedPayload
}) {
  const { payload } = params
  if (!payload.watchedCourse && !payload.watchedLp) return

  try {
    await fetch(`/api/courses/${encodeURIComponent(params.courseSlug)}/intro-videos/watched`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        watchedCourse: payload.watchedCourse,
        watchedLp: payload.watchedLp,
        learningPathId: payload.learningPathId,
        organizationId: params.organizationId || undefined,
      }),
    })
  } catch {
    // Fire-and-forget: local progress should not be blocked by analytics/progress sync.
  }
}

async function fetchIntroVideosForSlug(
  slug: string,
  organizationId?: string | null,
): Promise<string[]> {
  try {
    const res = await fetch(buildIntroVideosUrl(slug, organizationId), {
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = (await res.json()) as IntroVideosResponse & { success: boolean }
    if (!data.success) return []
    return data.courseVideos ?? data.videos ?? []
  } catch {
    return []
  }
}

function resolveWithoutIntroVideosAfterTimeout(): Promise<string[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve([]), INTRO_VIDEO_RESTART_TIMEOUT_MS)
  })
}

export function useCourseIntroVideos({
  courseSlug,
  organizationId,
  enabled = true,
}: UseCourseIntroVideosOptions): UseCourseIntroVideosResult {
  const [introVideos, setIntroVideos] = useState<string[]>([])
  const [showVideoIntro, setShowVideoIntro] = useState(false)
  const [isForceShow, setIsForceShow] = useState(false)
  // Empieza true para bloquear el tour hasta que el fetch complete
  const [isLoadingIntro, setIsLoadingIntro] = useState(true)

  const allVideosRef = useRef<string[]>([])
  const pendingFirstPlaybackVideosRef = useRef<string[]>([])
  const restartRequestIdRef = useRef(0)
  const watchedPayloadRef = useRef<IntroVideosWatchedPayload>({
    watchedCourse: false,
    watchedLp: false,
  })
  const afterVideoRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !courseSlug) return

    let cancelled = false

    const fetchCourseVideo = async () => {
      try {
        const res = await fetch(buildIntroVideosUrl(courseSlug, organizationId), {
          credentials: 'include',
        })
        if (!res.ok || cancelled) return

        const data = (await res.json()) as IntroVideosResponse & { success: boolean }
        if (!data.success || cancelled) return

        const courseVideoUrls = data.courseVideos ?? data.videos ?? []

        allVideosRef.current = courseVideoUrls
        watchedPayloadRef.current = {
          watchedCourse: data.hasCourseVideo && !data.courseIntroWatched,
          watchedLp: false,
        }

        const videosPendingOnThisDevice = filterUnwatchedIntroVideos({
          courseSlug,
          organizationId,
          videoUrls: courseVideoUrls,
        })
        pendingFirstPlaybackVideosRef.current = videosPendingOnThisDevice

        setIntroVideos(videosPendingOnThisDevice)
        setShowVideoIntro(videosPendingOnThisDevice.length > 0)

        if (videosPendingOnThisDevice.length === 0) {
          void markIntroVideosWatchedOnServer({
            courseSlug,
            organizationId,
            payload: watchedPayloadRef.current,
          })
        }
      } catch {
        // Si falla el fetch, no bloquear el tour
      } finally {
        if (!cancelled) setIsLoadingIntro(false)
      }
    }

    void fetchCourseVideo()
    return () => { cancelled = true }
  }, [courseSlug, enabled, organizationId])

  const handleVideoIntroComplete = useCallback(() => {
    const wasFirstTime = !isForceShow
    const watchedVideos = pendingFirstPlaybackVideosRef.current
    const watchedPayload = watchedPayloadRef.current
    setShowVideoIntro(false)
    setIsForceShow(false)
    setIntroVideos([])

    if (wasFirstTime && watchedVideos.length > 0) {
      markIntroVideosWatched({
        courseSlug,
        organizationId,
        videoUrls: watchedVideos,
      })
      pendingFirstPlaybackVideosRef.current = []
    }

    if (wasFirstTime) {
      void markIntroVideosWatchedOnServer({
        courseSlug,
        organizationId,
        payload: watchedPayload,
      })
      watchedPayloadRef.current = {
        watchedCourse: false,
        watchedLp: false,
      }
    }

    const after = afterVideoRef.current
    afterVideoRef.current = null
    after?.()
  }, [courseSlug, isForceShow, organizationId])

  const restartWithIntroVideos = useCallback(
    (afterFn: () => void) => {
      const cachedCourseVideos = allVideosRef.current

      if (cachedCourseVideos.length > 0) {
        afterVideoRef.current = afterFn
        pendingFirstPlaybackVideosRef.current = []
        setIntroVideos(cachedCourseVideos)
        setIsForceShow(true)
        setShowVideoIntro(true)
        return
      }

      // Si la carga inicial fallo o aun no termino, hacemos un fetch acotado
      // para no bloquear indefinidamente el inicio manual del tour.
      const requestId = restartRequestIdRef.current + 1
      restartRequestIdRef.current = requestId

      Promise.race([
        fetchIntroVideosForSlug(courseSlug, organizationId),
        resolveWithoutIntroVideosAfterTimeout(),
      ]).then((videos) => {
        if (restartRequestIdRef.current !== requestId) return

        if (videos.length > 0) {
          allVideosRef.current = videos
          afterVideoRef.current = afterFn
          pendingFirstPlaybackVideosRef.current = []
          setIntroVideos(videos)
          setIsForceShow(true)
          setShowVideoIntro(true)
        } else {
          // No hay videos configurados → lanzar el tour directamente
          afterFn()
        }
      })
    },
    [courseSlug, organizationId],
  )

  return {
    introVideos,
    showVideoIntro,
    isForceShow,
    isLoadingIntro,
    handleVideoIntroComplete,
    restartWithIntroVideos,
  }
}
