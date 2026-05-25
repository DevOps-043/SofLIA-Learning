import { useCallback, useEffect, useState } from 'react'
import {
  fetchIntroVideoState,
  getIntroFallback,
  markIntroVideoWatched,
} from './intro-video.api'
import type { IntroVideoState } from './types'

export function useIntroVideos(orgSlug: string, learningPathIdKey: string) {
  const [introByPath, setIntroByPath] = useState<Record<string, IntroVideoState>>({})

  useEffect(() => {
    if (!orgSlug || !learningPathIdKey) {
      setIntroByPath({})
      return
    }

    const pathIds = learningPathIdKey.split('|').filter(Boolean)
    let cancelled = false

    setIntroByPath((current) => {
      const next: Record<string, IntroVideoState> = {}
      for (const pathId of pathIds) {
        next[pathId] = {
          ...(current[pathId] ?? getIntroFallback(true)),
          loading: true,
          showPlayer: false,
        }
      }
      return next
    })

    async function loadIntroVideos() {
      const entries = await Promise.all(
        pathIds.map((pathId) => fetchIntroVideoState(orgSlug, pathId)),
      )

      if (!cancelled) {
        setIntroByPath((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }))
      }
    }

    void loadIntroVideos()

    return () => {
      cancelled = true
    }
  }, [orgSlug, learningPathIdKey])

  const openTour = useCallback((pathId: string) => {
    setIntroByPath((current) => {
      const intro = current[pathId]
      if (!intro?.introVideoUrl) return current

      return {
        ...current,
        [pathId]: {
          ...intro,
          showPlayer: true,
        },
      }
    })
  }, [])

  const completeTour = useCallback(
    (pathId: string) => {
      const shouldMarkWatched = Boolean(
        introByPath[pathId]?.introVideoUrl && !introByPath[pathId]?.watched,
      )

      setIntroByPath((current) => {
        const intro = current[pathId]
        if (!intro) return current

        return {
          ...current,
          [pathId]: {
            ...intro,
            watched: true,
            showPlayer: false,
          },
        }
      })

      if (shouldMarkWatched && orgSlug) {
        void markIntroVideoWatched(orgSlug, pathId)
      }
    },
    [introByPath, orgSlug],
  )

  return { completeTour, introByPath, openTour }
}
