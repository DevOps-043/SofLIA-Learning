'use client'

import { useCallback } from 'react'
import useSWR from 'swr'

import {
  fetchNotebookGeneration,
  requestCourseCompendium,
} from '../services/notebook.client.service'
import type { GenerationState, NotebookGenerationResponse } from '../types'

const GENERATION_POLL_MS = 4_000

export function useCourseNotebookGeneration(params: {
  orgSlug?: string | null
  courseId?: string | null
  lessonId?: string | null
  enabled?: boolean
}) {
  const enabled = (params.enabled ?? true) && Boolean(params.orgSlug && params.courseId)
  const key = enabled
    ? ['notebook-generation', params.orgSlug, params.courseId, params.lessonId ?? '']
    : null

  const { data, error, isLoading, mutate } = useSWR<NotebookGenerationResponse>(
    key,
    () =>
      fetchNotebookGeneration(params.orgSlug!, {
        courseId: params.courseId!,
        lessonId: params.lessonId ?? undefined,
      }),
    {
      revalidateOnFocus: true,
      refreshInterval: (latest) => {
        const state = latest?.compendium
        return !state || state.status === 'queued' || state.status === 'processing' || state.status === 'stale'
          ? GENERATION_POLL_MS
          : 0
      },
    },
  )

  const requestCompendium = useCallback(async (): Promise<GenerationState | null> => {
    if (!params.orgSlug || !params.courseId) return null
    try {
      const result = await requestCourseCompendium(params.orgSlug, params.courseId)
      await mutate(
        (current) => ({ ...(current ?? {}), compendium: result.state }),
        { revalidate: true },
      )
      return result.state
    } catch {
      return null
    }
  }, [mutate, params.courseId, params.orgSlug])

  return {
    generation: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    requestCompendium,
    refresh: () => void mutate(),
  }
}
