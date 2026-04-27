'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useLanguage } from '@/core/providers/I18nProvider'

import type {
  LessonSuggestionItem,
  LessonSuggestionsActivityFocus,
  LessonSuggestionsLanguage,
  LessonSuggestionsResponse,
} from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

const ENDPOINT_PATH = '/api/lia/lesson-suggestions'

interface UseLessonChatSuggestionsParams {
  lessonId: string | null | undefined
  courseSlug: string | null | undefined
  enabled: boolean
  activityFocus?: LessonSuggestionsActivityFocus
}

export interface UseLessonChatSuggestionsReturn {
  suggestions: LessonSuggestionItem[]
  isLoading: boolean
  error: Error | null
  markUsed: (id: string) => void
  reset: () => void
}

function isSupportedLanguage(value: string): value is LessonSuggestionsLanguage {
  return value === 'es' || value === 'en' || value === 'pt'
}

export function useLessonChatSuggestions(
  params: UseLessonChatSuggestionsParams,
): UseLessonChatSuggestionsReturn {
  const { lessonId, courseSlug, enabled, activityFocus } = params
  const { language } = useLanguage()

  const [allSuggestions, setAllSuggestions] = useState<LessonSuggestionItem[]>(
    [],
  )
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestKeyRef = useRef<string | null>(null)
  const activityFocusRef = useRef<LessonSuggestionsActivityFocus | undefined>(
    activityFocus,
  )

  useEffect(() => {
    activityFocusRef.current = activityFocus
  }, [activityFocus])

  const supportedLanguage: LessonSuggestionsLanguage = isSupportedLanguage(
    language,
  )
    ? language
    : 'es'

  const activityKey = useMemo(() => {
    if (!activityFocus) {
      return ''
    }
    return `${activityFocus.title}|${activityFocus.type}|${
      activityFocus.description ?? ''
    }`
  }, [activityFocus])

  const reset = useCallback(() => {
    setUsedIds(new Set())
  }, [])

  const markUsed = useCallback((id: string) => {
    setUsedIds((previous) => {
      if (previous.has(id)) {
        return previous
      }
      const next = new Set(previous)
      next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    if (!enabled || !lessonId || !courseSlug) {
      return
    }

    const requestKey = `${lessonId}|${supportedLanguage}|${activityKey}`

    if (requestKeyRef.current === requestKey) {
      return
    }

    requestKeyRef.current = requestKey

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)
    setAllSuggestions([])
    setUsedIds(new Set())

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(ENDPOINT_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            lessonId,
            courseSlug,
            language: supportedLanguage,
            activityFocus: activityFocusRef.current,
          }),
        })

        if (!response.ok) {
          if (controller.signal.aborted) {
            return
          }

          if (response.status === 503) {
            setAllSuggestions([])
            return
          }

          throw new Error(
            `lesson-suggestions request failed with status ${String(
              response.status,
            )}`,
          )
        }

        const payload = (await response.json()) as LessonSuggestionsResponse

        if (controller.signal.aborted) {
          return
        }

        if (Array.isArray(payload.suggestions)) {
          setAllSuggestions(payload.suggestions)
        } else {
          setAllSuggestions([])
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return
        }
        setError(
          caught instanceof Error ? caught : new Error('Unknown fetch error'),
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchSuggestions()

    return () => {
      controller.abort()
    }
  }, [enabled, lessonId, courseSlug, supportedLanguage, activityKey])

  useEffect(() => {
    if (!enabled) {
      requestKeyRef.current = null
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [enabled])

  const visibleSuggestions = useMemo(
    () => allSuggestions.filter((item) => !usedIds.has(item.id)),
    [allSuggestions, usedIds],
  )

  return {
    suggestions: visibleSuggestions,
    isLoading,
    error,
    markUsed,
    reset,
  }
}
