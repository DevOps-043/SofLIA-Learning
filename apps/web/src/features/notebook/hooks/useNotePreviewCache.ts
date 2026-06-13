'use client'

import { useCallback, useRef, useState } from 'react'

import { fetchNotebookNote } from '../services/notebook.client.service'
import type { NotebookNoteDetail } from '../types'

/**
 * Lazily fetches and caches full note details for hover previews, so each note
 * is fetched at most once regardless of how often it is hovered.
 */
export function useNotePreviewCache(orgSlug: string) {
  const [previews, setPreviews] = useState<Record<string, NotebookNoteDetail>>(
    {},
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const cacheRef = useRef<Record<string, NotebookNoteDetail>>({})
  const inFlight = useRef<Set<string>>(new Set())

  const requestPreview = useCallback(
    (noteId: string) => {
      if (cacheRef.current[noteId] || inFlight.current.has(noteId)) return

      inFlight.current.add(noteId)
      setLoadingId(noteId)

      fetchNotebookNote(orgSlug, noteId)
        .then((detail) => {
          cacheRef.current = { ...cacheRef.current, [noteId]: detail }
          setPreviews(cacheRef.current)
        })
        .catch(() => {
          // Preview is best-effort; failures are silent.
        })
        .finally(() => {
          inFlight.current.delete(noteId)
          setLoadingId((id) => (id === noteId ? null : id))
        })
    },
    [orgSlug],
  )

  return { previews, loadingId, requestPreview }
}
