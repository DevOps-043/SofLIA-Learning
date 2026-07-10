'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchNotebookNotes } from '../services/notebook.client.service'
import type { NotebookSelection, NotebookFlatNote } from './useNotebookTree'
import type {
  NotebookKnowledgeType,
  NotebookLifecycleStatus,
  NotebookNoteListItem,
  NotebookNoteSource,
} from '../types'

function toFlatNote(item: NotebookNoteListItem): NotebookFlatNote {
  return {
    note: item,
    courseId: item.courseId,
    courseTitle: item.courseTitle,
    lessonId: item.lessonId ?? '',
    lessonTitle: item.lessonTitle ?? '',
  }
}

export function useNotebookNotesList(params: {
  orgSlug: string
  enabled: boolean
  selection: NotebookSelection
  query: string
  source: NotebookNoteSource | 'all'
  knowledgeType: NotebookKnowledgeType | 'all'
  lifecycleStatus: NotebookLifecycleStatus | 'all'
}) {
  const [debouncedQuery, setDebouncedQuery] = useState(params.query)
  const [notes, setNotes] = useState<NotebookFlatNote[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(params.query.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [params.query])

  const filters = {
    query: debouncedQuery || undefined,
    source: params.source === 'all' ? undefined : params.source,
    courseId: params.selection.type === 'all' ? undefined : params.selection.courseId,
    lessonId: params.selection.type === 'lesson' ? params.selection.lessonId : undefined,
    knowledgeType: params.knowledgeType === 'all' ? undefined : params.knowledgeType,
    lifecycleStatus: params.lifecycleStatus === 'all' ? undefined : params.lifecycleStatus,
  }

  const load = useCallback(async () => {
    if (!params.enabled || !params.orgSlug) return
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const page = await fetchNotebookNotes(params.orgSlug, filters)
      if (requestId !== requestIdRef.current) return
      setNotes(page.notes.map(toFlatNote))
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  // Primitive dependencies intentionally mirror the serialized API filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.enabled, params.orgSlug, debouncedQuery, params.source, params.knowledgeType, params.lifecycleStatus, params.selection.type, params.selection.type === 'all' ? '' : params.selection.courseId, params.selection.type === 'lesson' ? params.selection.lessonId : ''])

  useEffect(() => {
    void load()
    return () => {
      requestIdRef.current += 1
    }
  }, [load])

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const page = await fetchNotebookNotes(params.orgSlug, {
        ...filters,
        cursor: nextCursor,
      })
      setNotes((current) => {
        const seen = new Set(current.map((item) => item.note.noteId))
        return [...current, ...page.notes.filter((item) => !seen.has(item.noteId)).map(toFlatNote)]
      })
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setIsLoadingMore(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, nextCursor, params.orgSlug, debouncedQuery, params.source, params.knowledgeType, params.lifecycleStatus, params.selection.type, params.selection.type === 'all' ? '' : params.selection.courseId, params.selection.type === 'lesson' ? params.selection.lessonId : ''])

  return { notes, nextCursor, isLoading, isLoadingMore, error, reload: load, loadMore }
}
