'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft, Loader2, PanelLeft, Plus, Search } from 'lucide-react'

import { cn } from '@/utils/cn'
import { useNotebookTree } from '../hooks/useNotebookTree'
import { useNotePreviewCache } from '../hooks/useNotePreviewCache'
import { NotebookTree } from './NotebookTree'
import { NotebookNoteCard } from './NotebookNoteCard'
import { NotebookEmptyState } from './NotebookEmptyState'
import { NewNoteModal } from './NewNoteModal'

interface NotebookPageClientProps {
  orgSlug: string
}

export function NotebookPageClient({ orgSlug }: NotebookPageClientProps) {
  const { t } = useTranslation('notebook')
  const router = useRouter()
  const {
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
    totalNotes,
  } = useNotebookTree(orgSlug)
  const { previews, loadingId, requestPreview } = useNotePreviewCache(orgSlug)

  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false)
  const [showTreeMobile, setShowTreeMobile] = useState(false)

  const openNote = useCallback(
    (noteId: string) => {
      router.push(`/${orgSlug}/business-user/notebook/${noteId}`)
    },
    [orgSlug, router],
  )

  const goToDashboard = useCallback(() => {
    router.push(`/${orgSlug}/business-user/dashboard`)
  }, [orgSlug, router])

  const handleCreated = useCallback(
    (noteId: string) => {
      setIsNewNoteOpen(false)
      // Refresh the tree so the new note is present when the user returns.
      void reload()
      openNote(noteId)
    },
    [openNote, reload],
  )

  const hasNotes = totalNotes > 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToDashboard}
            aria-label={t('backToDashboard')}
            title={t('backToDashboard')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsNewNoteOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t('newNote.button')}
        </button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Mobile tree toggle */}
        <button
          type="button"
          onClick={() => setShowTreeMobile((value) => !value)}
          className="flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 lg:hidden dark:border-white/10 dark:text-gray-300"
        >
          <PanelLeft className="h-4 w-4" />
          {t('tree.toggle')}
        </button>

        <aside
          className={cn(
            'rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03] lg:block',
            showTreeMobile ? 'block' : 'hidden',
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <NotebookTree
              tree={tree}
              selection={selection}
              onSelect={(next) => {
                setSelection(next)
                setShowTreeMobile(false)
              }}
              expandedCourses={expandedCourses}
              onToggleCourse={toggleCourse}
            />
          )}
        </aside>

        <main className="min-h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-6 py-12 text-center">
              <AlertCircle className="h-7 w-7 text-[var(--color-error)]" />
              <p className="text-sm text-gray-700 dark:text-gray-200">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {t('error.retry')}
              </button>
            </div>
          ) : !hasNotes ? (
            <NotebookEmptyState
              title={t('empty.title')}
              description={t('empty.description')}
              action={
                <button
                  type="button"
                  onClick={() => setIsNewNoteOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  {t('newNote.button')}
                </button>
              }
            />
          ) : visibleNotes.length === 0 ? (
            <NotebookEmptyState
              title={t('empty.filteredTitle')}
              description={t('empty.filteredDescription')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleNotes.map((item) => (
                <NotebookNoteCard
                  key={item.note.noteId}
                  item={item}
                  preview={previews[item.note.noteId]}
                  isPreviewLoading={loadingId === item.note.noteId}
                  onOpen={openNote}
                  onRequestPreview={requestPreview}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <NewNoteModal
        orgSlug={orgSlug}
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
