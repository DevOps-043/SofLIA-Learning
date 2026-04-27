'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { IntroVideosResponse } from '@/app/api/courses/[slug]/intro-videos/route'

interface UseCourseIntroVideosOptions {
  courseSlug: string
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

export function useCourseIntroVideos({
  courseSlug,
  enabled = true,
}: UseCourseIntroVideosOptions): UseCourseIntroVideosResult {
  const [introVideos, setIntroVideos] = useState<string[]>([])
  const [showVideoIntro, setShowVideoIntro] = useState(false)
  const [isForceShow, setIsForceShow] = useState(false)
  const [isLoadingIntro, setIsLoadingIntro] = useState(true)

  // Metadata del fetch para usarla en markWatched
  const watchedPayloadRef = useRef<{ watchedLp: boolean; watchedCourse: boolean; learningPathId: string | null }>({
    watchedLp: false,
    watchedCourse: false,
    learningPathId: null,
  })
  // Indica si hay videos de LP o curso configurados (para el restart)
  const hasAnyVideoRef = useRef(false)
  // Callback a disparar tras completar el player en modo re-visita voluntaria
  const afterVideoRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !courseSlug) {
      setIsLoadingIntro(false)
      return
    }

    let cancelled = false

    const fetchIntroVideos = async () => {
      try {
        const response = await fetch(`/api/courses/${courseSlug}/intro-videos`, {
          credentials: 'include',
        })
        if (!response.ok || cancelled) return

        const data = (await response.json()) as IntroVideosResponse & { success: boolean }
        if (!data.success || cancelled) return

        hasAnyVideoRef.current = data.hasLpVideo || data.hasCourseVideo
        watchedPayloadRef.current = {
          watchedLp: !data.lpIntroWatched && data.hasLpVideo,
          watchedCourse: !data.courseIntroWatched && data.hasCourseVideo,
          learningPathId: data.learningPathId,
        }

        setIntroVideos(data.videos)
        setShowVideoIntro(data.videos.length > 0)
      } catch {
        // Si falla el fetch de intro videos, simplemente no los mostramos
      } finally {
        if (!cancelled) setIsLoadingIntro(false)
      }
    }

    void fetchIntroVideos()
    return () => { cancelled = true }
  }, [courseSlug, enabled])

  const markWatched = useCallback(
    async (opts: { watchedCourse: boolean; watchedLp: boolean; learningPathId: string | null }) => {
      if (!opts.watchedCourse && !opts.watchedLp) return
      try {
        await fetch(`/api/courses/${courseSlug}/intro-videos/watched`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            watchedCourse: opts.watchedCourse,
            watchedLp: opts.watchedLp,
            learningPathId: opts.learningPathId,
          }),
        })
      } catch {
        // fire-and-forget — no bloquear la UI por un error de tracking
      }
    },
    [courseSlug],
  )

  const handleVideoIntroComplete = useCallback(() => {
    setShowVideoIntro(false)

    if (!isForceShow) {
      // Primera vez — marcar como visto en DB
      void markWatched(watchedPayloadRef.current)
    }

    setIsForceShow(false)

    // Disparar callback de re-visita si existe (ej. launch del tour)
    const after = afterVideoRef.current
    afterVideoRef.current = null
    after?.()
  }, [isForceShow, markWatched])

  const restartWithIntroVideos = useCallback(
    (afterFn: () => void) => {
      // Si no hay videos configurados para este curso, lanzar el callback directamente
      if (!hasAnyVideoRef.current && !introVideos.length) {
        afterFn()
        return
      }

      afterVideoRef.current = afterFn
      setIsForceShow(true)
      setShowVideoIntro(true)
    },
    [introVideos.length],
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
