'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'

import {
  fetchNoteEnrichmentState,
  reviewNotebookNoteEnrichment,
  retryNotebookNoteEnrichment,
  updateDerivedTask,
} from '../services/notebook.client.service'
import type {
  NotebookDerivedTaskStatus,
  NotebookEnrichmentReviewInput,
  NotebookNoteEnrichmentState,
} from '../types'

/** Poll cadence while an enrichment job is in flight. */
const PENDING_REFRESH_MS = 6_000

/**
 * Loads the AI enrichment state of a note and keeps polling while a job is
 * pending/processing, so the summary/concepts/tasks appear without a manual
 * refresh shortly after saving. Task mutations are optimistic with rollback.
 */
export function useNoteEnrichment(
  orgSlug: string,
  noteId: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true
  const [isReviewing, setIsReviewing] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<NotebookNoteEnrichmentState>(
    enabled && orgSlug && noteId
      ? ['notebook-note-enrichment', orgSlug, noteId]
      : null,
    () => fetchNoteEnrichmentState(orgSlug, noteId),
    {
      revalidateOnFocus: false,
      refreshInterval: (latest) =>
        latest && (latest.jobStatus === 'pending' || latest.jobStatus === 'processing')
          ? PENDING_REFRESH_MS
          : 0,
    },
  )

  const setTaskStatus = useCallback(
    async (
      taskId: string,
      status: Exclude<NotebookDerivedTaskStatus, 'suggested'>,
    ): Promise<boolean> => {
      const previous = data
      if (previous) {
        // Optimistic: reflect the new status immediately, rollback on error.
        void mutate(
          {
            ...previous,
            tasks: previous.tasks.map((task) =>
              task.taskId === taskId ? { ...task, status } : task,
            ),
          },
          { revalidate: false },
        )
      }
      try {
        const updated = await updateDerivedTask(orgSlug, taskId, status)
        void mutate(
          (current) =>
            current
              ? {
                  ...current,
                  tasks: current.tasks.map((task) =>
                    task.taskId === updated.taskId ? updated : task,
                  ),
                }
              : current,
          { revalidate: false },
        )
        return true
      } catch {
        if (previous) void mutate(previous, { revalidate: false })
        return false
      }
    },
    [orgSlug, data, mutate],
  )

  const reviewEnrichment = useCallback(
    async (input: NotebookEnrichmentReviewInput): Promise<boolean> => {
      setIsReviewing(true)
      try {
        const updated = await reviewNotebookNoteEnrichment(orgSlug, noteId, input)
        await mutate(updated, { revalidate: false })
        return true
      } catch {
        return false
      } finally {
        setIsReviewing(false)
      }
    },
    [mutate, noteId, orgSlug],
  )

  const retryEnrichment = useCallback(async (): Promise<boolean> => {
    setIsRetrying(true)
    try {
      const updated = await retryNotebookNoteEnrichment(orgSlug, noteId)
      await mutate(updated, { revalidate: false })
      return true
    } catch {
      return false
    } finally {
      setIsRetrying(false)
    }
  }, [mutate, noteId, orgSlug])

  return {
    state: data ?? null,
    isLoading,
    loadError: error
      ? error instanceof Error
        ? error.message
        : 'No se pudo cargar el enriquecimiento.'
      : null,
    setTaskStatus,
    reviewEnrichment,
    retryEnrichment,
    isReviewing,
    isRetrying,
    refresh: () => void mutate(),
  }
}
