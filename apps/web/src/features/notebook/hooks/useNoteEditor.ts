'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'

import {
  deleteNotebookNote,
  fetchNotebookNote,
  updateNotebookNote,
} from '../services/notebook.client.service'
import type { NotebookNoteDetail } from '../types'

export type NoteSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 1200

interface EditableFields {
  title: string
  content: string
  tags: string[]
}

function fieldsEqual(a: EditableFields, b: EditableFields): boolean {
  return (
    a.title === b.title &&
    a.content === b.content &&
    a.tags.length === b.tags.length &&
    a.tags.every((tag, index) => tag === b.tags[index])
  )
}

/**
 * Loads a note (cached via SWR for instant re-opens and request dedup) and
 * manages title/content/tags with debounced autosave. Persistence is org-scoped
 * server-side; this hook only orchestrates state and keeps the SWR cache fresh.
 */
export function useNoteEditor(orgSlug: string, noteId: string) {
  const {
    data: note,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<NotebookNoteDetail>(
    orgSlug && noteId ? ['notebook-note', orgSlug, noteId] : null,
    () => fetchNotebookNote(orgSlug, noteId),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle')
  const [isDeleting, setIsDeleting] = useState(false)

  const lastSavedRef = useRef<EditableFields | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seededNoteIdRef = useRef<string | null>(null)
  const latestRef = useRef<EditableFields>({ title: '', content: '', tags: [] })

  latestRef.current = { title, content, tags }

  // Seed local editable state once per loaded note (does not clobber edits on
  // background revalidation, since it only runs when the note id changes).
  useEffect(() => {
    if (!note || seededNoteIdRef.current === note.noteId) return
    seededNoteIdRef.current = note.noteId
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags)
    lastSavedRef.current = {
      title: note.title,
      content: note.content,
      tags: note.tags,
    }
  }, [note])

  const loadError = swrError
    ? swrError instanceof Error
      ? swrError.message
      : 'No se pudo cargar la nota.'
    : null

  const persist = useCallback(async () => {
    const current = latestRef.current
    if (lastSavedRef.current && fieldsEqual(current, lastSavedRef.current)) {
      return
    }
    setSaveStatus('saving')
    try {
      const updated = await updateNotebookNote(orgSlug, noteId, {
        title: current.title,
        content: current.content,
        tags: current.tags,
      })
      lastSavedRef.current = {
        title: current.title,
        content: current.content,
        tags: current.tags,
      }
      // Keep the SWR cache in sync without triggering a refetch.
      void mutate(updated, { revalidate: false })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [orgSlug, noteId, mutate])

  // Debounced autosave whenever an editable field changes.
  useEffect(() => {
    if (isLoading || loadError) return
    if (!lastSavedRef.current) return
    if (fieldsEqual({ title, content, tags }, lastSavedRef.current)) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void persist()
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [title, content, tags, isLoading, loadError, persist])

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await persist()
  }, [persist])

  const removeNote = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteNotebookNote(orgSlug, noteId)
      // Invalidate the list cache so the deleted note disappears on return.
      void globalMutate(['notebook-tree', orgSlug])
      return true
    } catch {
      setIsDeleting(false)
      return false
    }
  }, [orgSlug, noteId])

  return {
    note: note ?? null,
    title,
    setTitle,
    content,
    setContent,
    tags,
    setTags,
    isLoading,
    loadError,
    saveStatus,
    isDeleting,
    saveNow,
    removeNote,
  }
}
