'use client'

/**
 * useNotebookPageLogic
 *
 * Orchestrates all state, data fetching, and business logic for the
 * Notebook page. Keeps the page component purely presentational.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentOrganizationSlug } from '@/core/stores/organizationStore'
import {
  getNotebookCourses,
  getNotebookNotes,
} from '../services/notebook.client.service'
import type {
  NotebookCourse,
  NotebookItem,
  NotebookModalState,
  NotebookTab,
} from '../types'
import { NOTEBOOK_DEFAULT_PAGE_SIZE } from '../types'

// ---------------------------------------------------------------------------
// Public Hook API
// ---------------------------------------------------------------------------

export interface UseNotebookPageLogicReturn {
  // Data
  items: NotebookItem[]
  courses: NotebookCourse[]

  // UI state
  activeTab: NotebookTab
  selectedCourseId: string | null
  modalState: NotebookModalState
  isLoadingNotes: boolean
  isLoadingCourses: boolean
  isLoadingMore: boolean
  hasMore: boolean
  errorMessage: string | null

  // Actions
  setActiveTab: (tab: NotebookTab) => void
  setSelectedCourseId: (courseId: string | null) => void
  openModal: (item: NotebookItem) => void
  closeModal: () => void
  setModalEditMode: () => void
  loadMore: () => void
  retryFetch: () => void
}

export function useNotebookPageLogic(): UseNotebookPageLogicReturn {
  const { t } = useTranslation('common')
  const orgSlug = useCurrentOrganizationSlug()

  // Data state
  const [items, setItems] = useState<NotebookItem[]>([])
  const [courses, setCourses] = useState<NotebookCourse[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState<NotebookTab>('all')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [modalState, setModalState] = useState<NotebookModalState>({
    isOpen: false,
    item: null,
    mode: 'read',
  })

  // Loading state
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Prevent double-fetch in React strict mode
  const fetchedRef = useRef(false)

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchNotes = useCallback(
    async (courseId?: string | null, cursor?: string | null) => {
      if (!orgSlug) return

      const isInitialLoad = !cursor
      if (isInitialLoad) {
        setIsLoadingNotes(true)
        setErrorMessage(null)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const result = await getNotebookNotes(orgSlug, {
          courseId: courseId || undefined,
          cursor: cursor || undefined,
          limit: NOTEBOOK_DEFAULT_PAGE_SIZE,
        })

        if (isInitialLoad) {
          setItems(result.items)
        } else {
          setItems((prev) => [...prev, ...result.items])
        }

        setNextCursor(result.nextCursor)
      } catch {
        setErrorMessage(t('notebook.error.description'))
      } finally {
        setIsLoadingNotes(false)
        setIsLoadingMore(false)
      }
    },
    [orgSlug, t],
  )

  const fetchCourses = useCallback(async () => {
    if (!orgSlug) return

    setIsLoadingCourses(true)
    try {
      const result = await getNotebookCourses(orgSlug)
      setCourses(result.courses)
    } catch {
      // Non-blocking: courses list is supplementary
    } finally {
      setIsLoadingCourses(false)
    }
  }, [orgSlug])

  // Initial fetch
  useEffect(() => {
    if (!orgSlug || fetchedRef.current) return
    fetchedRef.current = true
    fetchNotes()
    fetchCourses()
  }, [orgSlug, fetchNotes, fetchCourses])

  // Refetch notes when active tab or course filter changes
  useEffect(() => {
    if (!orgSlug) return
    // Don't refetch on first render (handled above)
    if (!fetchedRef.current) return

    if (activeTab === 'all') {
      fetchNotes(null)
    } else if (activeTab === 'by_course' && selectedCourseId) {
      fetchNotes(selectedCourseId)
    } else if (activeTab === 'by_course' && !selectedCourseId) {
      // "By course" tab selected but no course chosen: show all
      fetchNotes(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCourseId])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleSetActiveTab = useCallback(
    (tab: NotebookTab) => {
      setActiveTab(tab)
      if (tab === 'all') {
        setSelectedCourseId(null)
      }
    },
    [],
  )

  const handleSetSelectedCourseId = useCallback((courseId: string | null) => {
    setSelectedCourseId(courseId)
  }, [])

  const openModal = useCallback((item: NotebookItem) => {
    setModalState({ isOpen: true, item, mode: 'read' })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, item: null, mode: 'read' })
  }, [])

  const setModalEditMode = useCallback(() => {
    setModalState((prev) => ({ ...prev, mode: 'edit' }))
  }, [])

  const loadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) return
    fetchNotes(
      activeTab === 'by_course' ? selectedCourseId : null,
      nextCursor,
    )
  }, [nextCursor, isLoadingMore, fetchNotes, activeTab, selectedCourseId])

  const retryFetch = useCallback(() => {
    fetchedRef.current = false
    setItems([])
    setCourses([])
    setNextCursor(null)
    setErrorMessage(null)
    fetchedRef.current = true
    fetchNotes()
    fetchCourses()
  }, [fetchNotes, fetchCourses])

  return {
    items,
    courses,
    activeTab,
    selectedCourseId,
    modalState,
    isLoadingNotes,
    isLoadingCourses,
    isLoadingMore,
    hasMore: nextCursor !== null,
    errorMessage,
    setActiveTab: handleSetActiveTab,
    setSelectedCourseId: handleSetSelectedCourseId,
    openModal,
    closeModal,
    setModalEditMode,
    loadMore,
    retryFetch,
  }
}
