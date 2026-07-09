'use client'

import { useCallback } from 'react'
import useSWR from 'swr'

import {
  fetchNoteEnrichmentState,
  updateDerivedTask,
} from '../services/notebook.client.service'
import type {
  NotebookDerivedTaskStatus,
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

  return {
    state: data ?? null,
    isLoading,
    loadError: error
      ? error instanceof Error
        ? error.message
        : 'No se pudo cargar el enriquecimiento.'
      : null,
    setTaskStatus,
    refresh: () => void mutate(),
  }
}
