'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { fetchNotebookTree } from '../services/notebook.client.service'
import type { NotebookNoteSummary, NotebookTree } from '../types'

export type NotebookSelection =
  | { type: 'all' }
  | { type: 'course'; courseId: string }
  | { type: 'lesson'; courseId: string; lessonId: string }

export interface NotebookFlatNote {
  note: NotebookNoteSummary
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
}

const EMPTY_TREE: NotebookTree = { courses: [], totalNotes: 0 }

function matchesSearch(item: NotebookFlatNote, query: string): boolean {
  if (!query) return true
  const haystack = [
    item.note.title,
    item.courseTitle,
    item.lessonTitle,
    ...item.note.tags,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function matchesSelection(
  item: NotebookFlatNote,
  selection: NotebookSelection,
): boolean {
  switch (selection.type) {
    case 'all':
      return true
    case 'course':
      return item.courseId === selection.courseId
    case 'lesson':
      return item.lessonId === selection.lessonId
  }
}

/**
 * Loads the org-scoped notebook tree (cached via SWR for instant re-visits and
 * request dedup) and derives the visible note list from the current selection
 * (all / course / lesson) and search query.
 */
export function useNotebookTree(orgSlug: string) {
  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<NotebookTree>(
    orgSlug ? ['notebook-tree', orgSlug] : null,
    () => fetchNotebookTree(orgSlug),
    { revalidateOnFocus: false, dedupingInterval: 30_000, keepPreviousData: true },
  )

  const tree = data ?? EMPTY_TREE
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : 'Error al cargar apuntes.'
    : null

  const [selection, setSelection] = useState<NotebookSelection>({ type: 'all' })
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

  const reload = useCallback(() => {
    void mutate()
  }, [mutate])

  // Expand the first course by default once the tree is available.
  useEffect(() => {
    if (tree.courses.length === 0) return
    setExpandedCourses((current) =>
      current.size > 0
        ? current
        : new Set(tree.courses.slice(0, 1).map((course) => course.courseId)),
    )
  }, [tree.courses])

  const flatNotes = useMemo<NotebookFlatNote[]>(() => {
    const items: NotebookFlatNote[] = []
    for (const course of tree.courses) {
      // The course compendium is course-scoped (no lesson), so it surfaces in
      // "all notes" and course-level selection but never in a lesson filter.
      if (course.compendium) {
        items.push({
          note: course.compendium,
          courseId: course.courseId,
          courseTitle: course.title,
          lessonId: '',
          lessonTitle: '',
        })
      }
      for (const lesson of course.lessons) {
        for (const note of lesson.notes) {
          items.push({
            note,
            courseId: course.courseId,
            courseTitle: course.title,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.title,
          })
        }
      }
    }
    return items
  }, [tree])

  const visibleNotes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return flatNotes
      .filter(
        (item) =>
          matchesSelection(item, selection) &&
          matchesSearch(item, normalizedQuery),
      )
      .sort((a, b) => b.note.updatedAt.localeCompare(a.note.updatedAt))
  }, [flatNotes, selection, searchQuery])

  const toggleCourse = useCallback((courseId: string) => {
    setExpandedCourses((current) => {
      const next = new Set(current)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }, [])

  return {
    tree,
    isLoading,
    error,
    reload,
    selection,
    setSelection,
    searchQuery,
    setSearchQuery,
    expandedCourses,
    toggleCourse,
    visibleNotes,
    totalNotes: tree.totalNotes,
  }
}
