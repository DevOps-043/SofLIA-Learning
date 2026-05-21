'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { UserDropdown } from '@/core/components/UserDropdown'
import { NOTEBOOK_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'
import { JoyrideClient } from '@/features/tours/components/JoyrideClient'
import { useJoyrideMinitour } from '@/features/tours/hooks/useJoyrideMinitour'
import {
  NOTEBOOK_MINITOUR_ID,
  buildNotebookMinitourSteps,
} from '@/features/tours/config/notebook-minitour-steps'
import { useNotebookPageLogic } from '../hooks/useNotebookPageLogic'
import { NotebookHeader } from './NotebookHeader'
import { NotebookTabs } from './NotebookTabs'
import { NotebookCourseFilter } from './NotebookCourseFilter'
import { NotebookNoteCard } from './NotebookNoteCard'
import { NotebookNoteModal } from './NotebookNoteModal'
import { NotebookEmptyState } from './NotebookEmptyState'

/**
 * NotebookPageClient
 *
 * Main client component for the Libro de Apuntes page.
 * Orchestrates the tab UI, course filter, notes grid, modal, and pagination.
 */
interface NotebookPageClientProps {
  orgSlug?: string
}

export function NotebookPageClient({ orgSlug }: NotebookPageClientProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const {
    items,
    courses,
    activeTab,
    selectedCourseId,
    modalState,
    isLoadingNotes,
    isLoadingCourses,
    isLoadingMore,
    isSavingNote,
    isDuplicatingSummary,
    hasMore,
    errorMessage,
    mutationError,
    setActiveTab,
    setSelectedCourseId,
    openModal,
    closeModal,
    setModalEditMode,
    setModalReadMode,
    saveManualNote,
    duplicateSummary,
    loadMore,
    retryFetch,
  } = useNotebookPageLogic({ orgSlug })
  const tourSteps = useMemo(
    () => buildNotebookMinitourSteps((key) => String(t(key))),
    [t],
  )
  const notebookTour = useJoyrideMinitour({
    enabled: !isLoadingNotes && !errorMessage,
    label: String(t('notebookTour.restart')),
    steps: tourSteps,
    tourId: NOTEBOOK_MINITOUR_ID,
  })

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    if (orgSlug) {
      router.push(`/${orgSlug}/business-user/dashboard`)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-gray-950">
      <div
        id={NOTEBOOK_TOUR_TARGET_IDS.toolbar}
        className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/90"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8 lg:px-12">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-teal-300 hover:text-teal-600 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-teal-600 dark:hover:text-teal-300"
            onClick={handleBack}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('actions.back')}
          </button>

          <UserDropdown />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-12">
        <NotebookHeader />

        <NotebookTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Course filter (visible on "By course" tab) */}
        {activeTab === 'by_course' && (
          <NotebookCourseFilter
            courses={courses}
            selectedCourseId={selectedCourseId}
            onSelect={setSelectedCourseId}
            isLoading={isLoadingCourses}
          />
        )}

      {/* Error state */}
        {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {t('notebook.error.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {errorMessage}
          </p>
          <button
            onClick={retryFetch}
            className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200"
          >
            {t('notebook.error.retry')}
          </button>
        </motion.div>
        )}

      {/* Loading state */}
        {isLoadingNotes && !errorMessage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="space-y-1.5 mb-4">
                <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3.5 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3.5 w-4/6 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
        )}

      {/* Notes grid */}
        {!isLoadingNotes && !errorMessage && items.length > 0 && (
        <>
          <div
            id={NOTEBOOK_TOUR_TARGET_IDS.notesGrid}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((item, index) => {
              const key =
                item.kind === 'manual_note'
                  ? `note-${item.noteId}`
                  : `summary-${item.summaryId}`

              return (
                <NotebookNoteCard
                  key={key}
                  item={item}
                  index={index}
                  onClick={openModal}
                />
              )
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-200 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {t('notebook.loadMore')}
              </button>
            </div>
          )}
        </>
        )}

      {/* Empty state */}
        {!isLoadingNotes && !errorMessage && items.length === 0 && (
          <div id={NOTEBOOK_TOUR_TARGET_IDS.notesGrid}>
            <NotebookEmptyState isCourseFiltered={!!selectedCourseId} />
          </div>
        )}
      </main>

      {/* Modal */}
      <NotebookNoteModal
        state={modalState}
        errorMessage={mutationError}
        isDuplicatingSummary={isDuplicatingSummary}
        isSavingNote={isSavingNote}
        onCancelEdit={setModalReadMode}
        onClose={closeModal}
        onDuplicateSummary={duplicateSummary}
        onEdit={setModalEditMode}
        onSaveManualNote={saveManualNote}
      />

      {notebookTour.isMounted && notebookTour.joyrideProps.run ? (
        <JoyrideClient {...notebookTour.joyrideProps} />
      ) : null}
    </div>
  )
}
