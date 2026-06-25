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
      const inMemoryCached = previewCacheRef.current.get(content.key)
      if (inMemoryCached) {
        setHoverCard((current) =>
          current?.key === content.key ? { ...current, ...inMemoryCached, loading: false } : current,
        )
        return
      }

      if (!orgSlug || previewRequestRef.current.has(content.key)) return
      previewRequestRef.current.add(content.key)

      const locale = typeof document !== 'undefined'
        ? document.documentElement.lang || navigator.language
        : undefined

      try {
        // Phase 1: fast cache check — auth + single DB read, no learning-path loading.
        // If the summary already exists, show it immediately without "Analizando" state.
        const cacheParams = new URLSearchParams({ kind: content.kind, targetId: content.targetId })
        if (locale) cacheParams.set('locale', locale)

        const cacheResponse = await fetch(
          `/api/${encodeURIComponent(orgSlug)}/business-user/learning-preview?${cacheParams}`,
          { credentials: 'include' },
        )

        if (cacheResponse.ok) {
          const data = (await cacheResponse.json()) as GeminiPreviewResponse
          if (data.success && data.description && Array.isArray(data.points)) {
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
            return
          }
        }

        // Phase 2: no cache — switch to loading state and generate with Gemini via POST.
        // This is the first-time generation path; showing the "Analizando" skeleton here is correct.
        setHoverCard((current) =>
          current?.key === content.key ? { ...current, loading: true } : current,
        )

        const response = await fetch(
          `/api/${encodeURIComponent(orgSlug)}/business-user/learning-preview`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ kind: content.kind, targetId: content.targetId, locale }),
          },
        )
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
    // Start with loading:false regardless — requestPreviewAnalysis will flip to loading:true
    // only when it confirms no DB cache exists (Phase 2). This prevents showing "Analizando"
    // for already-generated summaries while the fast GET check completes (~50-150 ms).
    setHoverCard({
      ...content,
      ...(cached ? { ...cached } : {}),
      loading: false,
      rect: anchor.getBoundingClientRect(),
    })
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
