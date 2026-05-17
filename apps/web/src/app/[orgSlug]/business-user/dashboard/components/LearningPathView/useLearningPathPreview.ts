import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  GeminiPreviewResponse,
  InfoHoverCardContent,
  InfoHoverCardState,
  LearningPathTranslator,
  PreviewCacheValue,
} from './types'

export function useLearningPathPreview(
  orgSlug: string,
  t: LearningPathTranslator,
) {
  const [hoverCard, setHoverCard] = useState<InfoHoverCardState | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewCacheRef = useRef(new Map<string, PreviewCacheValue>())
  const previewRequestRef = useRef(new Set<string>())

  const clearHoverHideTimeout = useCallback(() => {
    if (!hideTimeoutRef.current) return
    clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = null
  }, [])

  const requestPreviewAnalysis = useCallback(
    async (content: InfoHoverCardContent) => {
      const cached = previewCacheRef.current.get(content.key)
      if (cached) {
        setHoverCard((current) =>
          current?.key === content.key ? { ...current, ...cached, loading: false } : current,
        )
        return
      }

      if (!orgSlug || previewRequestRef.current.has(content.key)) return
      previewRequestRef.current.add(content.key)

      try {
        const locale = typeof document !== 'undefined'
          ? document.documentElement.lang || navigator.language
          : undefined
        const response = await fetch(`/api/${encodeURIComponent(orgSlug)}/business-user/learning-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ kind: content.kind, targetId: content.targetId, locale }),
        })
        const data = (await response.json()) as GeminiPreviewResponse

        if (!response.ok || !data.success || !data.description || !Array.isArray(data.points)) {
          throw new Error('Invalid preview response')
        }

        const analysis = {
          description: data.description,
          points: data.points.slice(0, 3),
          source: data.source,
          model: data.model,
        }

        previewCacheRef.current.set(content.key, analysis)
        setHoverCard((current) =>
          current?.key === content.key ? { ...current, ...analysis, loading: false } : current,
        )
      } catch {
        setHoverCard((current) =>
          current?.key === content.key
            ? {
                ...current,
                description: t(
                  'dashboard.learningPaths.previewUnavailable',
                  'No se pudo generar el analisis con Gemini en este momento.',
                ),
                points: [],
                loading: false,
                source: 'fallback',
              }
            : current,
        )
      } finally {
        previewRequestRef.current.delete(content.key)
      }
    },
    [orgSlug, t],
  )

  const showPreview = useCallback((anchor: HTMLElement, content: InfoHoverCardContent) => {
    clearHoverHideTimeout()
    const cached = previewCacheRef.current.get(content.key)
    setHoverCard({ ...content, ...(cached ? { ...cached, loading: false } : null), rect: anchor.getBoundingClientRect() })
    if (!cached) void requestPreviewAnalysis(content)
  }, [clearHoverHideTimeout, requestPreviewAnalysis])

  const scheduleHidePreview = useCallback(() => {
    clearHoverHideTimeout()
    hideTimeoutRef.current = setTimeout(() => {
      setHoverCard(null)
      hideTimeoutRef.current = null
    }, 120)
  }, [clearHoverHideTimeout])

  const closePreview = useCallback(() => setHoverCard(null), [])
  useEffect(() => clearHoverHideTimeout, [clearHoverHideTimeout])

  return { clearHoverHideTimeout, closePreview, hoverCard, scheduleHidePreview, showPreview }
}
