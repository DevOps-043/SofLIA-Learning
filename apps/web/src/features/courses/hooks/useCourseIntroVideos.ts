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

function prefetchVideos(urls: string[]) {
  if (typeof document === 'undefined') return
  for (const url of urls) {
    if (!url) continue
    const selector = `link[rel="prefetch"][href="${url}"]`
    if (document.head.querySelector(selector)) continue
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.setAttribute('as', 'fetch')
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
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
    return data.allVideos ?? []
  } catch {
    return []
  }
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

        allVideosRef.current = data.allVideos ?? []
        const videosPendingOnThisDevice = filterUnwatchedIntroVideos({
          courseSlug,
          organizationId,
          videoUrls: data.allVideos ?? [],
        })
        pendingFirstPlaybackVideosRef.current = videosPendingOnThisDevice

        // Prefetch en background
        prefetchVideos(data.allVideos ?? [])

        setIntroVideos(videosPendingOnThisDevice)
        setShowVideoIntro(videosPendingOnThisDevice.length > 0)
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

    const after = afterVideoRef.current
    afterVideoRef.current = null
    after?.()
  }, [courseSlug, isForceShow, organizationId])

  const restartWithIntroVideos = useCallback(
    (afterFn: () => void) => {
      // Siempre hacemos un fetch fresco al reiniciar el tour para garantizar
      // que mostramos los videos más recientes (el caché puede estar desactualizado
      // o vacío si la primera carga falló silenciosamente).
      fetchIntroVideosForSlug(courseSlug, organizationId).then((videos) => {
        if (videos.length > 0) {
          allVideosRef.current = videos
          prefetchVideos(videos)
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
